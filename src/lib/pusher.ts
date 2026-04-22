import Pusher from "pusher";
import { env } from "./env";

let pusher: Pusher | null = null;

export function getPusher(): Pusher {
  if (!pusher) {
    pusher = new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusher;
}

export async function notifyBookingUpdate(
  userId: string,
  bookingId: string,
  status: string,
  driverId?: string,
  driverName?: string
) {
  try {
    const pusher = getPusher();
    await pusher.trigger(`client-${userId}`, "booking-updated", {
      bookingId,
      status,
      driverId,
      driverName,
    });
    console.log(`Pusher notification sent to client-${userId} for booking ${bookingId}`);
  } catch (error) {
    console.error("Failed to send Pusher notification:", error);
  }
}
