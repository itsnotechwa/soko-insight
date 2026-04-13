// Offline sync logic for queued requests
import { offlineStorage } from './offlineStorage';
import api from '../services/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export class OfflineSync {
  private syncInProgress = false;
  private retryTimeout: number | null = null;

  async sync(): Promise<void> {
    if (this.syncInProgress || !offlineStorage.isOnline()) {
      return;
    }

    this.syncInProgress = true;

    try {
      const queuedRequests = await offlineStorage.getQueuedRequests();
      
      if (queuedRequests.length === 0) {
        this.syncInProgress = false;
        return;
      }

      console.log(`[OfflineSync] Syncing ${queuedRequests.length} queued requests`);

      for (const request of queuedRequests) {
        try {
          await this.processRequest(request);
          await offlineStorage.removeQueuedRequest(request.id);
        } catch (error) {
          console.error(`[OfflineSync] Error processing request ${request.id}:`, error);
          
          // Increment retry count
          const newRetries = request.retries + 1;
          await offlineStorage.updateRequestRetry(request.id, newRetries);

          // If max retries reached, remove the request
          if (newRetries >= MAX_RETRIES) {
            console.warn(`[OfflineSync] Max retries reached for request ${request.id}, removing`);
            await offlineStorage.removeQueuedRequest(request.id);
          }
        }
      }

      // Sync offline sales data
      await this.syncOfflineSales();
    } catch (error) {
      console.error('[OfflineSync] Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processRequest(request: any): Promise<void> {
    const { method, url, body, headers } = request;

    const config: any = {
      method,
      url,
      headers: headers || {},
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = body;
    }

    await api.request(config);
  }

  private async syncOfflineSales(): Promise<void> {
    try {
      const offlineSales = await offlineStorage.getOfflineSales();
      
      if (offlineSales.length === 0) {
        return;
      }

      console.log(`[OfflineSync] Syncing ${offlineSales.length} offline sales`);

      // Sync sales one by one to handle errors gracefully
      const successful: string[] = [];

      for (const sale of offlineSales) {
        try {
          await api.post('/sales/quick-entry', {
            productId: sale.productId,
            quantity: sale.quantity,
            unitPrice: sale.unitPrice,
            saleDate: sale.saleDate,
            channelId: sale.channelId,
            notes: sale.notes,
          });
          successful.push(sale.id);
        } catch (error) {
          console.error(`[OfflineSync] Error syncing sale ${sale.id}:`, error);
        }
      }

      // Remove successfully synced sales
      if (successful.length > 0) {
        const remaining = offlineSales.filter((s) => !successful.includes(s.id));
        await offlineStorage.clearOfflineSales();
        if (remaining.length > 0) {
          await offlineStorage.saveSalesOffline(remaining);
        }
      }
    } catch (error) {
      console.error('[OfflineSync] Error syncing offline sales:', error);
    }
  }

  startAutoSync(interval: number = 30000): void {
    // Sync immediately if online
    if (offlineStorage.isOnline()) {
      this.sync();
    }

    // Sync periodically
    setInterval(() => {
      if (offlineStorage.isOnline()) {
        this.sync();
      }
    }, interval);

    // Sync when coming back online
    offlineStorage.onOnline(() => {
      console.log('[OfflineSync] Network back online, syncing...');
      this.sync();
    });
  }

  stopAutoSync(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }
}

export const offlineSync = new OfflineSync();

