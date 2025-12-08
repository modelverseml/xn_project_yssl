export default function NotificationButton({ docId }) {
  async function handleNotify() {
    try {
      await fetch(`http://localhost:8000/webapp/notify/?doc_id=${docId}`);
      alert("Notification triggered!");
    } catch (err) {
      console.error(err);
      alert("Notification failed");
    }
  }

  return <button onClick={handleNotify} style={{ margin: "10px 0" }}>Send Notification</button>;
}
