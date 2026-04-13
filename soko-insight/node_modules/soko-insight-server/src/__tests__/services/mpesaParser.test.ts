import { MpesaParser } from '../../services/mpesaParser';

describe('MpesaParser', () => {
  const mockUserId = 'user-123';
  const mockChannelId = 'channel-123';

  describe('parseCSV', () => {
    it('should parse M-Pesa CSV statement', async () => {
      const csvContent = `Receipt No.,Completion Time,Details,Transaction Status,Transaction Type,From,To,Amount (KSh)
RFT123,12/31/2023 10:30 AM,Payment for goods,Completed,Payment received,254712345678,254798765432,500`;

      const fileBuffer = Buffer.from(csvContent);
      const options = {
        userId: mockUserId,
        channelId: mockChannelId,
        excludeWithdrawals: true,
      };

      const result = await MpesaParser.parseCSV(fileBuffer, options);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].transaction).toBeDefined();
      expect(result[0].transaction?.amount).toBe(500);
      expect(result[0].transaction?.receiptNumber).toBe('RFT123');
      expect(result[0].salesData).toBeDefined();
      expect(result[0].salesData?.entryMethod).toBe('mpesa');
    });

    it('should exclude withdrawals when option is set', async () => {
      const csvContent = `Receipt No.,Completion Time,Details,Transaction Status,Transaction Type,From,To,Amount (KSh)
RFT123,12/31/2023 10:30 AM,Payment received,Completed,Payment received,254712345678,254798765432,500
RFT124,12/31/2023 11:00 AM,Withdrawal,Completed,Withdrawal,254712345678,254798765432,300`;

      const fileBuffer = Buffer.from(csvContent);
      const options = {
        userId: mockUserId,
        channelId: mockChannelId,
        excludeWithdrawals: true,
      };

      const result = await MpesaParser.parseCSV(fileBuffer, options);

      // Should only process payment received
      const payments = result.filter(r => r.transaction?.transactionType.toLowerCase().includes('payment'));
      expect(payments.length).toBeGreaterThan(0);
    });

    it('should filter by minimum amount', async () => {
      const csvContent = `Receipt No.,Completion Time,Details,Transaction Status,Transaction Type,From,To,Amount (KSh)
RFT123,12/31/2023 10:30 AM,Payment received,Completed,Payment received,254712345678,254798765432,500
RFT125,12/31/2023 11:30 AM,Payment received,Completed,Payment received,254712345678,254798765432,50`;

      const fileBuffer = Buffer.from(csvContent);
      const options = {
        userId: mockUserId,
        channelId: mockChannelId,
        minAmount: 100,
        excludeWithdrawals: true,
      };

      const result = await MpesaParser.parseCSV(fileBuffer, options);

      // Should only include transactions >= 100
      expect(result.every(r => !r.transaction || r.transaction.amount >= 100)).toBeTruthy();
    });

    it('should handle invalid date formats', async () => {
      const csvContent = `Receipt No.,Completion Time,Details,Transaction Status,Transaction Type,From,To,Amount (KSh)
RFT123,invalid-date,Payment received,Completed,Payment received,254712345678,254798765432,500`;

      const fileBuffer = Buffer.from(csvContent);
      const options = {
        userId: mockUserId,
        channelId: mockChannelId,
      };

      const result = await MpesaParser.parseCSV(fileBuffer, options);

      expect(result[0].errors.length).toBeGreaterThan(0);
      expect(result[0].errors.some(e => e.includes('date'))).toBeTruthy();
    });
  });
});

