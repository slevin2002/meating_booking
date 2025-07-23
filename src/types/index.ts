export interface Team {
  id: string;
  name: string;
  color: string;
  members: string[];
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  teamId: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  room?: string;
  isRecurring: boolean;
  recurringPattern?: "daily" | "weekly" | "monthly";
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  meetingId?: string;
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
  recurringPattern?: "daily" | "weekly" | "monthly";
}
