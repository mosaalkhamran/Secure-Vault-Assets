import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface VaultItem {
  id: string;
  fileName: string;
  fileUri: string;
  type: 'photo' | 'video';
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  addedAt: string;
  albumIds: string[];
  isFavorite: boolean;
}

export interface Album {
  id: string;
  name: string;
  createdAt: string;
  itemIds: string[];
}

export interface VaultSettings {
  faceIdEnabled: boolean;
  autoLockMinutes: number;
  keepOriginalDefault: boolean;
  isPremium: boolean;
}

const DEFAULT_SETTINGS: VaultSettings = {
  faceIdEnabled: false,
  autoLockMinutes: 5,
  keepOriginalDefault: true,
  isPremium: false,
};

const STORAGE_KEYS = {
  SETUP_COMPLETE: 'vault_setup_complete',
  PIN_HASH: 'vault_pin_hash',
  RECOVERY_HASH: 'vault_recovery_hash',
  ITEMS: 'vault_items',
  ALBUMS: 'vault_albums',
  SETTINGS: 'vault_settings',
};

export const VAULT_DIR = `${FileSystem.documentDirectory ?? ''}vault/media/`;

const WORDLIST = [
  'able','acid','aged','also','area','army','away','baby','back','ball',
  'band','bank','base','bath','bear','beat','bell','best','bird','blow',
  'blue','boat','body','bomb','bond','bone','book','born','both','bowl',
  'burn','busy','call','came','card','care','case','cash','cast','cave',
  'cell','chat','chip','city','clap','clay','club','coal','coat','code',
  'coin','cold','cook','cool','copy','cord','corn','cost','coup','crew',
  'crop','cure','cute','dame','dark','data','date','dawn','dead','deal',
  'dear','debt','deck','deep','deny','desk','diet','dirt','disk','dive',
  'dock','door','dorm','draw','drop','drug','drum','dust','duty','earn',
  'ease','east','edge','exam','face','fact','fair','fake','fall','fame',
  'farm','fast','fate','feed','feel','feet','fell','fill','film','fine',
  'fire','firm','fish','fist','flag','flat','flew','flip','flow','foam',
  'folk','fond','font','foot','fork','form','fort','four','free','fuel',
  'full','fund','gain','game','gate','gave','gaze','gear','gift','give',
  'glad','glow','glue','gold','golf','gone','good','grab','gray','grew',
  'grid','grip','gust','half','hall','hand','hard','harm','hate','have',
  'head','heap','heat','heel','held','here','hero','high','hill','hint',
  'hole','home','hood','hook','hope','horn','host','hour','huge','hull',
  'hunt','hurt','idea','inch','iron','item','joke','jump','just','keen',
  'keep','kind','king','knee','knew','know','lack','lake','land','lane',
  'last','late','lead','leaf','lean','leap','left','lend','lens','less',
  'lift','like','lime','link','lion','list','live','load','loan','lock',
  'long','look','lord','lost','loud','love','luck','made','mail','main',
  'make','many','mark','mask','mass','math','maze','meal','meat','meet',
  'melt','menu','mesh','mild','mill','mine','mode','moon','more','most',
  'move','much','must','nail','name','near','neck','need','news','next',
  'nice','node','none','norm','note','oath','odds','once','only','open',
  'oven','over','page','paid','pain','pair','park','part','past','path',
  'peak','pick','pier','pile','pipe','plan','play','plot','plug','plus',
  'poll','pond','port','post','pour','prey','pull','pump','pure','push',
  'race','rail','rain','read','real','reef','rely','rent','rest','rice',
  'rich','ride','ring','rise','risk','road','rock','role','roll','roof',
  'room','root','rope','rose','ruin','rule','rush','rust','safe','sage',
  'sail','sake','salt','same','sand','save','scan','seal','seed','seem',
  'self','sell','send','sent','shed','ship','shop','shot','show','shut',
  'silk','sink','site','skip','slow','snap','snow','soap','soft','soil',
  'sold','song','soon','soul','span','spin','spot','spur','star','stay',
  'stem','step','stop','suit','swap','swim','tale','tank','tape','task',
  'team','tear','tell','tend','term','text','tide','tile','time','tiny',
  'tire','toll','tomb','tone','took','tool','tour','town','trap','tree',
  'trim','trip','true','tune','turn','type','unit','used','user','vein',
  'very','vest','view','vine','vote','wake','walk','wall','ward','warm',
  'warn','wave','weak','wear','weld','went','wide','wild','will','wind',
  'wine','wing','wire','wise','wish','wood','word','work','wrap','yard',
  'year','zero','zone',
];

export const generateRecoveryKey = (): string => {
  return Array.from({ length: 12 }, () =>
    WORDLIST[Math.floor(Math.random() * WORDLIST.length)]
  ).join(' ');
};

const hashValue = async (value: string): Promise<string> => {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `vaultora_secure_2024_${value}`
  );
};

interface VaultContextType {
  isLoading: boolean;
  isSetupComplete: boolean;
  isUnlocked: boolean;
  vaultItems: VaultItem[];
  albums: Album[];
  settings: VaultSettings;
  isFaceIdAvailable: boolean;
  // Auth
  createPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  enableFaceId: () => Promise<boolean>;
  disableFaceId: () => Promise<void>;
  authenticateWithFaceId: () => Promise<boolean>;
  storeRecoveryKey: (key: string) => Promise<void>;
  verifyRecoveryKey: (key: string) => Promise<boolean>;
  // Vault ops
  unlock: () => void;
  lock: () => void;
  completeSetup: () => Promise<void>;
  resetVault: () => Promise<void>;
  addItems: (items: Omit<VaultItem, 'id' | 'addedAt' | 'albumIds' | 'isFavorite'>[]) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  // Albums
  createAlbum: (name: string) => Promise<Album>;
  deleteAlbum: (id: string) => Promise<void>;
  addItemsToAlbum: (itemIds: string[], albumId: string) => Promise<void>;
  // Settings
  updateSettings: (updates: Partial<VaultSettings>) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [settings, setSettings] = useState<VaultSettings>(DEFAULT_SETTINGS);
  const [isFaceIdAvailable, setIsFaceIdAvailable] = useState(false);

  useEffect(() => {
    initVault();
  }, []);

  const initVault = async () => {
    try {
      const [setupVal, settingsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);
      setIsSetupComplete(setupVal === 'true');
      if (settingsJson) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) });

      if (Platform.OS !== 'web') {
        const [hasHW, isEnrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        setIsFaceIdAvailable(hasHW && isEnrolled);
        await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true }).catch(() => {});
      }
    } catch (e) {
      console.error('Vault init error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVaultData = async () => {
    const [itemsJson, albumsJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ITEMS),
      AsyncStorage.getItem(STORAGE_KEYS.ALBUMS),
    ]);
    setVaultItems(itemsJson ? JSON.parse(itemsJson) : []);
    setAlbums(albumsJson ? JSON.parse(albumsJson) : []);
  };

  const saveItems = async (items: VaultItem[]) => {
    setVaultItems(items);
    await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  };

  const saveAlbums = async (alb: Album[]) => {
    setAlbums(alb);
    await AsyncStorage.setItem(STORAGE_KEYS.ALBUMS, JSON.stringify(alb));
  };

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
      promptMessage: 'Confirm your identity to enable Face ID',
      fallbackLabel: 'Use PIN instead',
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
    const hash = await hashValue(key);
    await SecureStore.setItemAsync(STORAGE_KEYS.RECOVERY_HASH, hash);
  };

  const verifyRecoveryKey = async (key: string): Promise<boolean> => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEYS.RECOVERY_HASH);
    if (!stored) return false;
    const hash = await hashValue(key);
    return stored === hash;
  };

  const unlock = useCallback(() => {
    setIsUnlocked(true);
    loadVaultData();
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
    setVaultItems([]);
    setAlbums([]);
  }, []);

  const completeSetup = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');
    setIsSetupComplete(true);
  };

  const resetVault = async () => {
    // Clear files
    if (Platform.OS !== 'web') {
      await FileSystem.deleteAsync(VAULT_DIR, { idempotent: true }).catch(() => {});
      await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true }).catch(() => {});
    }
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.SETUP_COMPLETE),
      AsyncStorage.removeItem(STORAGE_KEYS.ITEMS),
      AsyncStorage.removeItem(STORAGE_KEYS.ALBUMS),
      AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
      SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.RECOVERY_HASH).catch(() => {}),
    ]);
    setIsSetupComplete(false);
    setIsUnlocked(false);
    setVaultItems([]);
    setAlbums([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const addItems = async (items: Omit<VaultItem, 'id' | 'addedAt' | 'albumIds' | 'isFavorite'>[]) => {
    const newItems: VaultItem[] = items.map(item => ({
      ...item,
      id: `${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date().toISOString(),
      albumIds: [],
      isFavorite: false,
    }));
    await saveItems([...vaultItems, ...newItems]);
  };

  const deleteItem = async (id: string) => {
    const item = vaultItems.find(i => i.id === id);
    if (item && Platform.OS !== 'web') {
      await FileSystem.deleteAsync(item.fileUri, { idempotent: true }).catch(() => {});
    }
    await saveItems(vaultItems.filter(i => i.id !== id));
    const updatedAlbums = albums.map(a => ({ ...a, itemIds: a.itemIds.filter(i => i !== id) }));
    await saveAlbums(updatedAlbums);
  };

  const toggleFavorite = async (id: string) => {
    const updated = vaultItems.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i);
    await saveItems(updated);
  };

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

  const deleteAlbum = async (id: string) => {
    await saveAlbums(albums.filter(a => a.id !== id));
  };

  const addItemsToAlbum = async (itemIds: string[], albumId: string) => {
    const updated = albums.map(a => {
      if (a.id !== albumId) return a;
      const merged = [...a.itemIds, ...itemIds.filter(id => !a.itemIds.includes(id))];
      return { ...a, itemIds: merged };
    });
    await saveAlbums(updated);
  };

  const updateSettings = async (updates: Partial<VaultSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  };

  return (
    <VaultContext.Provider value={{
      isLoading, isSetupComplete, isUnlocked, vaultItems, albums, settings, isFaceIdAvailable,
      createPin, verifyPin, changePin,
      enableFaceId, disableFaceId, authenticateWithFaceId,
      storeRecoveryKey, verifyRecoveryKey,
      unlock, lock, completeSetup, resetVault,
      addItems, deleteItem, toggleFavorite,
      createAlbum, deleteAlbum, addItemsToAlbum,
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
