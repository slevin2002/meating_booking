export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  startTime?: Date;
  endTime?: Date;
  isAvailable?: boolean;
  meetingId?: string;
}

export interface Meeting {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  teamId: string | { _id: string; name: string; color?: string };
  teamName?: string;
  attendees: string[];
  room: string;
  status: "scheduled" | "completed" | "cancelled";
  cancelReason?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id?: string;
  _id?: string;
  name: string;
  color: string;
  members: string[];
  lead: string;
  project: string;
  status: "active" | "completed" | "on-hold";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  teamId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingFormData {
  title: string;
  description: string;
  teamId: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  room: string;
  isRecurring: boolean;
  recurringPattern: string;
}

export interface Booking {
  date: string;
  startTime: string;
  endTime: string;
  team?: string; // Make optional for legacy compatibility
  teamId?: string; // Add teamId for new booking flow
  title: string;
  room: string;
  attendees: string[];
}
