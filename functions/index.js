const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendChatNotification = functions.database
  .ref("/messages/{messageId}")
  .onCreate(async (snapshot) => {
    const message = snapshot.val();

    if (!message || !message.username || !message.message) {
      return null;
    }

    const tokensSnapshot = await admin.database().ref("/notificationTokens").once("value");

    if (!tokensSnapshot.exists()) {
      return null;
    }

    const senderKey = message.username.replace(/[.#$/\[\]]/g, "_");
    const tokens = [];

    tokensSnapshot.forEach((userSnapshot) => {
      if (userSnapshot.key === senderKey) {
        return false;
      }

      userSnapshot.forEach((tokenSnapshot) => {
        const tokenData = tokenSnapshot.val();

        if (tokenData && tokenData.token) {
          tokens.push(tokenData.token);
        }

        return false;
      });

      return false;
    });

    if (!tokens.length) {
      return null;
    }

    const payload = {
      notification: {
        title: `New message from ${message.username}`,
        body: message.message
      },
      data: {
        click_action: "/chat.html",
        sender: message.username
      },
      webpush: {
        fcmOptions: {
          link: "https://cyber-roadmap-chat.web.app/chat.html"
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: payload.notification,
      data: payload.data,
      webpush: payload.webpush
    });

    const cleanupTasks = [];

    response.responses.forEach((result, index) => {
      if (result.success) {
        return;
      }

      const errorCode = result.error && result.error.code;
      const token = tokens[index];
      const safeToken = token.replace(/[.#$/\[\]]/g, "_");

      if (
        errorCode === "messaging/registration-token-not-registered" ||
        errorCode === "messaging/invalid-registration-token"
      ) {
        tokensSnapshot.forEach((userSnapshot) => {
          if (userSnapshot.hasChild(safeToken)) {
            cleanupTasks.push(
              admin.database().ref(`/notificationTokens/${userSnapshot.key}/${safeToken}`).remove()
            );
          }

          return false;
        });
      }
    });

    await Promise.all(cleanupTasks);
    return null;
  });
