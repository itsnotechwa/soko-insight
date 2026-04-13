import { offlineStorage } from '../offlineStorage';

// Mock IndexedDB
const mockDB = {
  transaction: jest.fn(),
  objectStoreNames: {
    contains: jest.fn(),
  },
  createObjectStore: jest.fn(),
};

describe('OfflineStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DB
    (offlineStorage as any).db = null;
  });

  describe('queueRequest', () => {
    it('should queue a request for later sync', async () => {
      const mockStore = {
        add: jest.fn().mockReturnValue({
          onsuccess: null,
          onerror: null,
        }),
      };

      mockDB.transaction.mockReturnValue({
        objectStore: jest.fn().mockReturnValue(mockStore),
      });

      (offlineStorage as any).db = mockDB;

      const request = {
        method: 'POST',
        url: '/api/sales/quick-entry',
        body: { productId: 'prod-1', quantity: 5 },
      };

      // Mock successful add
      mockStore.add.mockImplementation((data) => {
        setTimeout(() => {
          if (mockStore.add.mock.results[0].value.onsuccess) {
            mockStore.add.mock.results[0].value.onsuccess();
          }
        }, 0);
        return { onsuccess: null, onerror: null };
      });

      await expect(offlineStorage.queueRequest(request)).resolves.not.toThrow();
    });
  });

  describe('isOnline', () => {
    it('should return true when online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(offlineStorage.isOnline()).toBe(true);
    });

    it('should return false when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(offlineStorage.isOnline()).toBe(false);
    });
  });
});

