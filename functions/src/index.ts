// functions/index.ts

import * as admin from "firebase-admin";
import {Expo, ExpoPushMessage} from "expo-server-sdk";

// Use the Firestore provider from the first-generation SDK
import {firestore} from "firebase-functions";

admin.initializeApp();
const expo = new Expo();

// Change the trigger syntax to the first-generation format
export const sendPushNotificationOnNewNotification =
firestore.onDocumentCreated(
  "notifications/{notificationId}", (async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }
    // The snapshot is now the direct parameter, no need to check event.data
    const notificationData = snapshot.data();

    // Check if the notification is global (userId is null)
    if (notificationData.userId === null) {
      // Get all users from the "users" collection
      const usersSnapshot = await admin.firestore().collection("users").get();
      const pushTokens: string[] = [];

      usersSnapshot.forEach((doc) => {
        const userPushToken = doc.data().pushToken;
        if (userPushToken && Expo.isExpoPushToken(userPushToken)) {
          pushTokens.push(userPushToken);
        }
      });

      const messages: ExpoPushMessage[] = pushTokens.map((token) => ({
        to: token,
        sound: "default",
        title: notificationData.title,
        body: notificationData.body,
        data: {id: snapshot.id},
      }));

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = await Promise.all(
        chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk))
      );
      console.log("Global notifications sent to all users.");
      return tickets;
    }

    // Existing logic for specific user notifications (if needed)
    const userId = notificationData.userId;
    if (!userId) {
      return null;
    }

    try {
      const userDoc =
      await admin.firestore().collection("users").doc(userId).get();
      const userPushToken = userDoc.data()?.pushToken;

      if (!userPushToken || !Expo.isExpoPushToken(userPushToken)) {
        console.error(`Invalid or missing push token for user: ${userId}`);
        return null;
      }

      const message: ExpoPushMessage = {
        to: userPushToken,
        sound: "default",
        title: notificationData.title,
        body: notificationData.body,
        data: {id: snapshot.id},
      };

      const ticket = await expo.sendPushNotificationsAsync([message]);
      console.log("Notification sent to specific user:", ticket);
      return ticket;
    } catch (error) {
      console.error("Error sending push notification:", error);
      return null;
    }
  }));


