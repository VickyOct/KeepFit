import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { ReminderStatus } from '../types';

const CHANNEL_ID = 'meal-reminders';
const REMINDER_TYPE = 'keepfit-meal-reminder';

const DAILY_REMINDERS = [
  {
    key: 'breakfast',
    hour: 9,
    title: '早餐记录提醒',
    body: '早上好，记得记录早餐和大概份量。',
  },
  {
    key: 'lunch',
    hour: 12,
    title: '午餐记录提醒',
    body: '午餐时间到了，拍一下今天吃了什么吧。',
  },
  {
    key: 'dinner',
    hour: 18,
    title: '晚餐记录提醒',
    body: '晚餐别忘了记录，看看今天的蛋白质进度。',
  },
] as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function hasPermission(status: Notifications.NotificationPermissionsStatus) {
  if (Platform.OS !== 'ios') return status.granted;

  const iosStatus = status.ios?.status;
  return (
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function prepareAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: '饮食记录提醒',
    description: '早餐、午餐和晚餐的饮食记录提醒',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 220, 140, 220],
    lightColor: '#275C3B',
  });
}

async function removeExistingMealReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const keepFitReminders = scheduled.filter(
    (request) => request.content.data?.type === REMINDER_TYPE,
  );

  await Promise.all(
    keepFitReminders.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier),
    ),
  );
}

export async function setupDailyMealReminders(): Promise<ReminderStatus> {
  if (Platform.OS === 'web') return 'error';

  try {
    await prepareAndroidChannel();

    let permission = await Notifications.getPermissionsAsync();
    if (!hasPermission(permission)) {
      permission = await Notifications.requestPermissionsAsync();
    }

    if (!hasPermission(permission)) return 'denied';

    await removeExistingMealReminders();

    await Promise.all(
      DAILY_REMINDERS.map((reminder) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.body,
            sound: 'default',
            data: {
              type: REMINDER_TYPE,
              reminderKey: reminder.key,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: reminder.hour,
            minute: 0,
            channelId: CHANNEL_ID,
          },
        }),
      ),
    );

    return 'scheduled';
  } catch {
    return 'error';
  }
}
