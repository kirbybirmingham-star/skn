import emailService from './emailService.js';

class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.batchSize = 10; // Process 10 emails at a time
    this.processingInterval = 1000; // Check queue every 1 second
  }

  /**
   * Add email to queue
   */
  async addToQueue(emailData, priority = 'normal') {
    const queueItem = {
      id: Date.now() + Math.random(),
      emailData,
      priority,
      retries: 0,
      addedAt: new Date(),
      lastAttempt: null,
      error: null,
    };

    // Insert based on priority
    if (priority === 'high') {
      this.queue.unshift(queueItem);
    } else {
      this.queue.push(queueItem);
    }

    console.log(`Email added to queue. Queue length: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return queueItem.id;
  }

  /**
   * Start processing the queue
   */
  startProcessing() {
    if (this.processing) return;

    this.processing = true;
    console.log('Email queue processing started');

    this.processInterval = setInterval(() => {
      this.processBatch();
    }, this.processingInterval);
  }

  /**
   * Stop processing the queue
   */
  stopProcessing() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    this.processing = false;
    console.log('Email queue processing stopped');
  }

  /**
   * Process a batch of emails
   */
  async processBatch() {
    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.batchSize);

    const promises = batch.map(item => this.processEmail(item));

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error processing email batch:', error);
    }
  }

  /**
   * Process a single email
   */
  async processEmail(queueItem) {
    try {
      queueItem.lastAttempt = new Date();

      // Attempt to send email
      const result = await emailService.sendEmail(queueItem.emailData);

      if (result.success) {
        console.log(`Email sent successfully: ${queueItem.id}`);
      } else {
        throw new Error(result.error || 'Unknown send error');
      }

    } catch (error) {
      console.error(`Failed to send email ${queueItem.id}:`, error);
      queueItem.error = error.message;
      queueItem.retries++;

      // Retry logic
      if (queueItem.retries < this.maxRetries) {
        // Add back to queue with exponential backoff
        const delay = this.retryDelay * Math.pow(2, queueItem.retries - 1);
        setTimeout(() => {
          this.queue.push(queueItem);
        }, delay);
        console.log(`Email ${queueItem.id} queued for retry ${queueItem.retries}/${this.maxRetries} in ${delay}ms`);
      } else {
        console.error(`Email ${queueItem.id} failed permanently after ${this.maxRetries} retries`);
        // Here you could log to a dead letter queue or emit an event
        this.handleFailedEmail(queueItem);
      }
    }
  }

  /**
   * Handle permanently failed emails
   */
  handleFailedEmail(queueItem) {
    // Log to database, send alert, etc.
    console.error('Email failed permanently:', {
      id: queueItem.id,
      emailData: queueItem.emailData,
      error: queueItem.error,
      attempts: queueItem.retries,
    });
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const stats = {
      queueLength: this.queue.length,
      processing: this.processing,
      pendingHighPriority: this.queue.filter(item => item.priority === 'high').length,
      pendingNormalPriority: this.queue.filter(item => item.priority === 'normal').length,
      averageRetries: 0,
    };

    if (this.queue.length > 0) {
      const totalRetries = this.queue.reduce((sum, item) => sum + item.retries, 0);
      stats.averageRetries = totalRetries / this.queue.length;
    }

    return stats;
  }

  /**
   * Clear the queue (emergency use only)
   */
  clearQueue() {
    const clearedCount = this.queue.length;
    this.queue = [];
    console.log(`Queue cleared. ${clearedCount} items removed.`);
    return clearedCount;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down email queue...');
    this.stopProcessing();

    // Process remaining items synchronously
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await Promise.all(batch.map(item => this.processEmail(item)));
    }

    console.log('Email queue shutdown complete');
  }
}

// Create singleton instance
const emailQueue = new EmailQueue();

export default emailQueue;