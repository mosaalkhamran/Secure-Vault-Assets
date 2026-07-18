import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { sha256 } from 'js-sha256';
import { encryptFile, generateSalt, generateVaultKey } from '@/services/encryption';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VaultItem {
  id: string;
  fileName: string;
  fileUri: string;
  originalName?: string;
  type: 'photo' | 'video';
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  addedAt: string;
  capturedAt?: string;
  albumIds: string[];
  isFavorite: boolean;
  deletedAt?: string | null;
  checksum?: string;
  nonce?: string;
  authTag?: string;
  assetId?: string;
  cloudStatus: 'local' | 'pending' | 'synced' | 'failed';
}

export interface Album {
  id: string;
  name: string;
  createdAt: string;
  itemIds: string[];
}

export interface VaultSettings {
  faceIdEnabled: boolean;
  autoLockSeconds: number; // 0=immediately, 15, 30, 60, 300, -1=never
  keepOriginalDefault: boolean;
  isPremium: boolean;
  privacyCoverEnabled: boolean;
  privacyCoverType: 'calculator' | 'notes' | 'clock' | 'tasks';
  dualVaultEnabled: boolean;
  trashRetentionDays: number;
  lockOnBackground: boolean;
}

export type SortOption = 'addedDesc' | 'addedAsc' | 'sizeDesc' | 'sizeAsc' | 'nameAsc' | 'capturedDesc';
export type FilterOption = 'all' | 'photos' | 'videos' | 'favorites';

const DEFAULT_SETTINGS: VaultSettings = {
  faceIdEnabled: false,
  autoLockSeconds: 300,
  keepOriginalDefault: true,
  isPremium: false,
  privacyCoverEnabled: false,
  privacyCoverType: 'calculator',
  dualVaultEnabled: false,
  trashRetentionDays: 30,
  lockOnBackground: false,
};

const STORAGE_KEYS = {
  SETUP_COMPLETE: 'vault_setup_complete',
  PIN_HASH: 'vault_pin_hash',
  RECOVERY_HASH: 'vault_recovery_hash',
  ALL_ITEMS: 'vault_all_items',
  ALBUMS: 'vault_albums',
  SETTINGS: 'vault_settings',
  FAILED_ATTEMPTS: 'vault_failed_attempts',
  LOCK_UNTIL: 'vault_lock_until',
};

export const VAULT_DIR = `${FileSystem.documentDirectory ?? ''}vault/media/`;
const TEMP_DIR = `${FileSystem.cacheDirectory ?? ''}vault_tmp/`;

// ─── Word list for 24-word recovery key ──────────────────────────────────────

const WORDLIST = [
  'able','acid','aged','also','area','army','away','baby','back','ball','band','bank','base','bath','bear',
  'beat','bell','best','bird','blow','blue','boat','body','bomb','bond','bone','book','born','both','bowl',
  'burn','busy','call','came','card','care','case','cash','cast','cave','cell','chat','chip','city','clap',
  'clay','club','coal','coat','code','coin','cold','cook','cool','copy','cord','corn','cost','coup','crew',
  'crop','cure','cute','dame','dark','data','date','dawn','dead','deal','dear','debt','deck','deep','deny',
  'desk','diet','dirt','disk','dive','dock','door','dorm','draw','drop','drug','drum','dust','duty','earn',
  'ease','east','edge','exam','face','fact','fair','fake','fall','fame','farm','fast','fate','feed','feel',
  'feet','fell','fill','film','fine','fire','firm','fish','fist','flag','flat','flew','flip','flow','foam',
  'folk','fond','font','foot','fork','form','fort','four','free','fuel','full','fund','gain','game','gate',
  'gave','gaze','gear','gift','give','glad','glow','glue','gold','golf','gone','good','grab','gray','grew',
  'grid','grip','gust','half','hall','hand','hard','harm','hate','have','head','heap','heat','heel','held',
  'here','hero','high','hill','hint','hole','home','hood','hook','hope','horn','host','hour','huge','hull',
  'hunt','hurt','idea','inch','iron','item','joke','jump','just','keen','keep','kind','king','knee','knew',
  'know','lack','lake','land','lane','last','late','lead','leaf','lean','leap','left','lend','lens','less',
  'lift','like','lime','link','lion','list','live','load','loan','lock','long','look','lord','lost','loud',
  'love','luck','made','mail','main','make','many','mark','mask','mass','math','maze','meal','meat','meet',
  'melt','menu','mesh','mild','mill','mine','mode','moon','more','most','move','much','must','nail','name',
  'near','neck','need','news','next','nice','node','none','norm','note','oath','odds','once','only','open',
  'oven','over','page','paid','pain','pair','park','part','past','path','peak','pick','pier','pile','pipe',
  'plan','play','plot','plug','plus','poll','pond','port','post','pour','prey','pull','pump','pure','push',
  'race','rail','rain','read','real','reef','rely','rent','rest','rice','rich','ride','ring','rise','risk',
  'road','rock','role','roll','roof','room','root','rope','rose','ruin','rule','rush','rust','safe','sage',
  'sail','sake','salt','same','sand','save','scan','seal','seed','seem','self','sell','send','sent','shed',
  'ship','shop','shot','show','shut','silk','sink','site','skip','slow','snap','snow','soap','soft','soil',
  'sold','song','soon','soul','span','spin','spot','spur','star','stay','stem','step','stop','suit','swap',
  'swim','tale','tank','tape','task','team','tear','tell','tend','term','text','tide','tile','time','tiny',
  'tire','toll','tomb','tone','took','tool','tour','town','trap','tree','trim','trip','true','tune','turn',
  'type','unit','used','user','vein','very','vest','view','vine','vote','wake','walk','wall','ward','warm',
  'warn','wave','weak','wear','weld','went','wide','wild','will','wind','wine','wing','wire','wise','wish',
  'wood','word','work','wrap','yard','year','zero','zone','able','arch','barn','bell','bolt','cage','calm',
  'cape','cart','cave','chef','chin','chip','clue','coil','comb','cone','cope','core','cove','curl','dash',
  'dawn','daze','dent','dew','dial','dice','dime','dip','dome','dose','dove','dusk','earl','echo','emit',
  'envy','epic','even','ever','evil','ewer','fawn','faze','fern','feud','figs','flaw','flea','flew','flit',
];

export const generateRecoveryKey = (): string => {
  return Array.from({ length: 24 }, () =>
    WORDLIST[Math.floor(Math.random() * WORDLIST.length)]
  ).join(' ');
};

const hashValue = async (value: string): Promise<string> => {
  return sha256(`vaultora_v2_secure_${value}`);
};

// ─── Attempt limiting logic ───────────────────────────────────────────────────

function getLockSeconds(attempts: number): number {
  if (attempts < 5) return 0;
  if (attempts < 8) return 30;
  if (attempts < 10) return 60;
  return 300;
}

// ─── Context types ────────────────────────────────────────────────────────────

interface VaultContextType {
  isLoading: boolean;
  isSetupComplete: boolean;
  isUnlocked: boolean;
  vaultItems: VaultItem[];
  trashedItems: VaultItem[];
  albums: Album[];
  settings: VaultSettings;
  isFaceIdAvailable: boolean;
  failedAttempts: number;
  lockUntil: number;
  // Auth
  createPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  enableFaceId: () => Promise<boolean>;
  disableFaceId: () => Promise<void>;
  authenticateWithFaceId: () => Promise<boolean>;
  storeRecoveryKey: (key: string) => Promise<void>;
  verifyRecoveryKey: (key: string) => Promise<boolean>;
  recordFailedAttempt: () => Promise<{ locked: boolean; lockSeconds: number }>;
  resetFailedAttempts: () => Promise<void>;
  // Vault ops
  unlock: () => void;
  lock: () => void;
  completeSetup: () => Promise<void>;
  resetVault: () => Promise<void>;
  addItems: (items: Omit<VaultItem, 'id' | 'addedAt' | 'albumIds' | 'isFavorite' | 'deletedAt' | 'cloudStatus'>[]) => Promise<VaultItem[]>;
  softDelete: (id: string) => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  exportToPhotos: (id: string) => Promise<boolean>;
  // Albums
  createAlbum: (name: string) => Promise<Album>;
  renameAlbum: (id: string, name: string) => Promise<void>;
  deleteAlbum: (id: string, deleteFiles?: boolean) => Promise<void>;
  addItemsToAlbum: (itemIds: string[], albumId: string) => Promise<void>;
  removeItemsFromAlbum: (itemIds: string[], albumId: string) => Promise<void>;
  // Settings
  updateSettings: (updates: Partial<VaultSettings>) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [allItems, setAllItems] = useState<VaultItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [settings, setSettings] = useState<VaultSettings>(DEFAULT_SETTINGS);
  const [isFaceIdAvailable, setIsFaceIdAvailable] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);

  const vaultItems = allItems.filter(i => !i.deletedAt);
  const trashedItems = allItems.filter(i => !!i.deletedAt);

  useEffect(() => {
    initVault();
  }, []);

  // Auto-purge trash items older than retention period
  useEffect(() => {
    if (!isUnlocked || trashedItems.length === 0) return;
    const retentionMs = settings.trashRetentionDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const expired = trashedItems.filter(
      i => i.deletedAt && now - new Date(i.deletedAt).getTime() > retentionMs
    );
    if (expired.length > 0) {
      expired.forEach(i => permanentDeleteById(i.id));
    }
  }, [isUnlocked]);

  const initVault = async () => {
    try {
      const [setupVal, settingsJson, attemptsStr, lockUntilStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        SecureStore.getItemAsync(STORAGE_KEYS.FAILED_ATTEMPTS).catch(() => null),
        SecureStore.getItemAsync(STORAGE_KEYS.LOCK_UNTIL).catch(() => null),
      ]);
      setIsSetupComplete(setupVal === 'true');
      if (settingsJson) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) });
      setFailedAttempts(attemptsStr ? parseInt(attemptsStr, 10) : 0);
      setLockUntil(lockUntilStr ? parseInt(lockUntilStr, 10) : 0);

      if (Platform.OS !== 'web') {
        const [hasHW, isEnrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        setIsFaceIdAvailable(hasHW && isEnrolled);
        await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true }).catch(() => {});
        await FileSystem.makeDirectoryAsync(TEMP_DIR, { intermediates: true }).catch(() => {});
      }
    } catch (e) {
      console.error('Vault init error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVaultData = async () => {
    const [itemsJson, albumsJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ALL_ITEMS),
      AsyncStorage.getItem(STORAGE_KEYS.ALBUMS),
    ]);
    setAllItems(itemsJson ? JSON.parse(itemsJson) : []);
    setAlbums(albumsJson ? JSON.parse(albumsJson) : []);
  };

  const saveAllItems = async (items: VaultItem[]) => {
    setAllItems(items);
    await AsyncStorage.setItem(STORAGE_KEYS.ALL_ITEMS, JSON.stringify(items));
  };

  const saveAlbums = async (alb: Album[]) => {
    setAlbums(alb);
    await AsyncStorage.setItem(STORAGE_KEYS.ALBUMS, JSON.stringify(alb));
  };

  // ─── Auth ────────────────────────────────────────────────────────────────────

  const createPin = async (pin: string) => {
    const hash = await hashValue(pin);
    await SecureStore.setItemAsync(STORAGE_KEYS.PIN_HASH, hash);
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
    if (!stored) return false;
    const hash = await hashValue(pin);
    return stored === hash;
  };

  const changePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    if (!(await verifyPin(oldPin))) return false;
    await createPin(newPin);
    return true;
  };

  const enableFaceId = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm identity to enable Face ID',
      fallbackLabel: 'Use PIN',
    });
    if (result.success) {
      await updateSettings({ faceIdEnabled: true });
      return true;
    }
    return false;
  };

  const disableFaceId = async () => {
    await updateSettings({ faceIdEnabled: false });
  };

  const authenticateWithFaceId = async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !settings.faceIdEnabled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Vaultora',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });
    return result.success;
  };

  const storeRecoveryKey = async (key: string) => {
    const hash = await hashValue(key.toLowerCase().trim());
    await SecureStore.setItemAsync(STORAGE_KEYS.RECOVERY_HASH, hash);
  };

  const verifyRecoveryKey = async (key: string): Promise<boolean> => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEYS.RECOVERY_HASH);
    if (!stored) return false;
    const hash = await hashValue(key.toLowerCase().trim());
    return stored === hash;
  };

  const recordFailedAttempt = async (): Promise<{ locked: boolean; lockSeconds: number }> => {
    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);
    await SecureStore.setItemAsync(STORAGE_KEYS.FAILED_ATTEMPTS, String(newCount));
    const lockSec = getLockSeconds(newCount);
    if (lockSec > 0) {
      const until = Date.now() + lockSec * 1000;
      setLockUntil(until);
      await SecureStore.setItemAsync(STORAGE_KEYS.LOCK_UNTIL, String(until));
    }
    return { locked: lockSec > 0, lockSeconds: lockSec };
  };

  const resetFailedAttempts = async () => {
    setFailedAttempts(0);
    setLockUntil(0);
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.FAILED_ATTEMPTS).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.LOCK_UNTIL).catch(() => {}),
    ]);
  };

  // ─── Vault lifecycle ─────────────────────────────────────────────────────────

  const unlock = useCallback(() => {
    setIsUnlocked(true);
    loadVaultData();
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
    setAllItems([]);
    setAlbums([]);
  }, []);

  const completeSetup = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');
    setIsSetupComplete(true);
  };

  const resetVault = async () => {
    if (Platform.OS !== 'web') {
      await FileSystem.deleteAsync(VAULT_DIR, { idempotent: true }).catch(() => {});
      await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true }).catch(() => {});
    }
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.SETUP_COMPLETE),
      AsyncStorage.removeItem(STORAGE_KEYS.ALL_ITEMS),
      AsyncStorage.removeItem(STORAGE_KEYS.ALBUMS),
      AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
      SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.RECOVERY_HASH).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.FAILED_ATTEMPTS).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.LOCK_UNTIL).catch(() => {}),
    ]);
    setIsSetupComplete(false);
    setIsUnlocked(false);
    setAllItems([]);
    setAlbums([]);
    setSettings(DEFAULT_SETTINGS);
    setFailedAttempts(0);
    setLockUntil(0);
  };

  // ─── Media ops ───────────────────────────────────────────────────────────────

  const addItems = async (
    items: Omit<VaultItem, 'id' | 'addedAt' | 'albumIds' | 'isFavorite' | 'deletedAt' | 'cloudStatus'>[]
  ): Promise<VaultItem[]> => {
    const newItems: VaultItem[] = items.map(item => ({
      ...item,
      id: `${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date().toISOString(),
      albumIds: [],
      isFavorite: false,
      deletedAt: null,
      cloudStatus: 'local' as const,
    }));
    await saveAllItems([...allItems, ...newItems]);
    return newItems;
  };

  const softDelete = async (id: string) => {
    const updated = allItems.map(i =>
      i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i
    );
    await saveAllItems(updated);
    // Remove from all albums
    const updatedAlbums = albums.map(a => ({
      ...a, itemIds: a.itemIds.filter(i => i !== id),
    }));
    await saveAlbums(updatedAlbums);
  };

  const softDeleteMultiple = async (ids: string[]) => {
    const now = new Date().toISOString();
    const updated = allItems.map(i =>
      ids.includes(i.id) ? { ...i, deletedAt: now } : i
    );
    await saveAllItems(updated);
  };

  const restoreFromTrash = async (id: string) => {
    const updated = allItems.map(i =>
      i.id === id ? { ...i, deletedAt: null } : i
    );
    await saveAllItems(updated);
  };

  const permanentDeleteById = async (id: string) => {
    const item = allItems.find(i => i.id === id);
    if (item && Platform.OS !== 'web') {
      await FileSystem.deleteAsync(item.fileUri, { idempotent: true }).catch(() => {});
    }
    await saveAllItems(allItems.filter(i => i.id !== id));
  };

  const permanentDelete = async (id: string) => {
    await permanentDeleteById(id);
  };

  const emptyTrash = async () => {
    const trashIds = allItems.filter(i => !!i.deletedAt).map(i => i.id);
    // Delete files
    if (Platform.OS !== 'web') {
      await Promise.all(
        allItems
          .filter(i => !!i.deletedAt)
          .map(i => FileSystem.deleteAsync(i.fileUri, { idempotent: true }).catch(() => {}))
      );
    }
    await saveAllItems(allItems.filter(i => !i.deletedAt));
  };

  const toggleFavorite = async (id: string) => {
    const updated = allItems.map(i =>
      i.id === id ? { ...i, isFavorite: !i.isFavorite } : i
    );
    await saveAllItems(updated);
  };

  const exportToPhotos = async (id: string): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    const item = allItems.find(i => i.id === id);
    if (!item) return false;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return false;
      await MediaLibrary.saveToLibraryAsync(item.fileUri);
      return true;
    } catch (e) {
      console.error('exportToPhotos error:', e);
      return false;
    }
  };

  // ─── Albums ──────────────────────────────────────────────────────────────────

  const createAlbum = async (name: string): Promise<Album> => {
    const album: Album = {
      id: `${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: new Date().toISOString(),
      itemIds: [],
    };
    await saveAlbums([...albums, album]);
    return album;
  };

  const renameAlbum = async (id: string, name: string) => {
    await saveAlbums(albums.map(a => a.id === id ? { ...a, name } : a));
  };

  const deleteAlbum = async (id: string, deleteFiles = false) => {
    if (deleteFiles) {
      const album = albums.find(a => a.id === id);
      if (album) await softDeleteMultiple(album.itemIds);
    }
    await saveAlbums(albums.filter(a => a.id !== id));
  };

  const addItemsToAlbum = async (itemIds: string[], albumId: string) => {
    const updated = albums.map(a => {
      if (a.id !== albumId) return a;
      const merged = [...a.itemIds, ...itemIds.filter(id => !a.itemIds.includes(id))];
      return { ...a, itemIds: merged };
    });
    await saveAlbums(updated);
    const updatedItems = allItems.map(i =>
      itemIds.includes(i.id) && !i.albumIds.includes(albumId)
        ? { ...i, albumIds: [...i.albumIds, albumId] }
        : i
    );
    await saveAllItems(updatedItems);
  };

  const removeItemsFromAlbum = async (itemIds: string[], albumId: string) => {
    const updated = albums.map(a =>
      a.id === albumId ? { ...a, itemIds: a.itemIds.filter(id => !itemIds.includes(id)) } : a
    );
    await saveAlbums(updated);
  };

  // ─── Settings ────────────────────────────────────────────────────────────────

  const updateSettings = async (updates: Partial<VaultSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  };

  return (
    <VaultContext.Provider value={{
      isLoading, isSetupComplete, isUnlocked,
      vaultItems, trashedItems, albums, settings,
      isFaceIdAvailable, failedAttempts, lockUntil,
      createPin, verifyPin, changePin,
      enableFaceId, disableFaceId, authenticateWithFaceId,
      storeRecoveryKey, verifyRecoveryKey,
      recordFailedAttempt, resetFailedAttempts,
      unlock, lock, completeSetup, resetVault,
      addItems, softDelete, restoreFromTrash, permanentDelete, emptyTrash,
      toggleFavorite, exportToPhotos,
      createAlbum, renameAlbum, deleteAlbum, addItemsToAlbum, removeItemsFromAlbum,
      updateSettings,
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}
