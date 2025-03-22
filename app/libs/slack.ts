export const sendSlackNotification = async (
  message: string,
  webhookUrl: string
) => {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });

    if (!res.ok) {
      console.error(`Slack通知失敗: ステータスコード ${res.status}`);
    }
  } catch (err) {
    console.error("Slack通知中にエラー:", err);
  }
};
