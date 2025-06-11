type NotificationOptions = chrome.notifications.NotificationOptions<true>;

interface NotificationDefaults {
  notificationId?: string;
  type?: chrome.notifications.TemplateType;
  iconUrl?: string;
  priority?: number;
  requireInteraction?: boolean;
}

export class BrowserNotifications {
  private static defaults: Required<NotificationDefaults> = {
    notificationId: `crx-notification-${Math.random()
      .toString(36)
      .substring(2, 15)}`,
    type: "basic",
    iconUrl: browser.runtime.getURL("icons/48.png" as any),
    priority: 1,
    requireInteraction: false,
  };

  static setDefaults(newDefaults: Partial<NotificationDefaults>) {
    this.defaults = {
      ...this.defaults,
      ...newDefaults,
    };
  }

  static create(
    options: Omit<
      NotificationOptions,
      "type" | "iconUrl" | "priority" | "requireInteraction"
    > &
      Partial<NotificationOptions>,
    notificationId?: string,
  ): Promise<string> {
    const finalId = notificationId ?? this.defaults.notificationId;
    const finalOptions: NotificationOptions = {
      type: this.defaults.type,
      iconUrl: this.defaults.iconUrl,
      priority: this.defaults.priority,
      requireInteraction: this.defaults.requireInteraction,
      ...options,
    };

    return new Promise((resolve, reject) => {
      browser.notifications.create(finalId, finalOptions, (id) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve(id);
        }
      });
    });
  }

  static clear(notificationId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      browser.notifications.clear(notificationId, (wasCleared) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve(wasCleared);
        }
      });
    });
  }

  static update(
    notificationId: string,
    options: Partial<NotificationOptions>,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      browser.notifications.update(notificationId, options, (wasUpdated) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve(wasUpdated);
        }
      });
    });
  }

  static getAll(): Promise<Record<string, NotificationOptions>> {
    return new Promise((resolve, reject) => {
      browser.notifications.getAll((notifications) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve(notifications as Record<string, NotificationOptions>);
        }
      });
    });
  }

  static async clearAll(): Promise<void> {
    const notifications = await this.getAll();
    await Promise.all(Object.keys(notifications).map((id) => this.clear(id)));
  }

  static async createOrUpdate(
    options: Omit<
      NotificationOptions,
      "type" | "iconUrl" | "priority" | "requireInteraction"
    > &
      Partial<NotificationOptions>,
    notificationId?: string,
  ): Promise<string> {
    const finalId = notificationId ?? this.defaults.notificationId;
    const finalOptions: NotificationOptions = {
      type: this.defaults.type,
      iconUrl: this.defaults.iconUrl,
      priority: this.defaults.priority,
      requireInteraction: this.defaults.requireInteraction,
      ...options,
    };

    const notifications = await this.getAll();
    if (finalId in notifications) {
      await this.update(finalId, finalOptions);
      return finalId;
    } else {
      return await this.create(options, finalId);
    }
  }
}

/*
import { BrowserNotifications } from "@/utils/notifications";

BrowserNotifications.setDefaults({
  iconUrl: chrome.runtime.getURL("icons/custom-icon.png"),
  requireInteraction: true, // Notification stays until dismissed
});


await BrowserNotifications.create({
  title: "Success",
  message: "Your task is complete!",
});


await BrowserNotifications.create(
  {
    title: "Download Complete",
    message: "File saved to Downloads.",
  },
  "download-notif"
);


await BrowserNotifications.update("download-notif", {
  message: "File uploaded instead.",
});

await BrowserNotifications.clear("download-notif");


const allNotifs = await BrowserNotifications.getAll();
console.log("Active notifications:", allNotifs);

await BrowserNotifications.clearAll();

await BrowserNotifications.createOrUpdate({
  title: "Upload Status",
  message: "50% complete",
}, "upload-notif");


await BrowserNotifications.createOrUpdate({
  title: "Upload Status",
  message: "Upload complete!",
}, "upload-notif");

*/
