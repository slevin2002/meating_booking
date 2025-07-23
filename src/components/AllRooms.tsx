import React, { useState, useEffect } from "react";
import "./AllRooms.css";

interface RoomStatus {
  room: string;
  status: "busy" | "free" | "loading";
  currentMeetings?: Array<{
    title: string;
    startTime: string;
    endTime: string;
    teamName: string;
    attendees: string[];
    attendeesCount: number;
  }>;
}

interface AllRoomsProps {
  teams: any[];
}

const AllRooms: React.FC<AllRoomsProps> = ({ teams }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check room availability
  useEffect(() => {
    const fetchRoomStatuses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current date and time
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const currentDate = `${year}-${month}-${day}`;
        const currentHour = String(now.getHours()).padStart(2, "0");
        const currentMinute = String(now.getMinutes()).padStart(2, "0");
        const currentTime = `${currentHour}:${currentMinute}`;

        const apiUrl = `http://localhost:5000/api/status/all-rooms?date=${currentDate}&time=${currentTime}`;
        console.log("FETCHING ROOM STATUSES:", apiUrl);

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received room statuses:", data);

        // Transform the data to match our interface
        const transformedStatuses: RoomStatus[] = data.roomStatuses.map(
          (roomStatus: any) => ({
            room: roomStatus.room,
            status: roomStatus.status,
            currentMeetings: roomStatus.meetings || [],
          })
        );

        setRoomStatuses(transformedStatuses);
        setLastUpdated(new Date());
        setLoading(false);

        // Set initial loading to false after 3 seconds
        setTimeout(() => {
          setInitialLoading(false);
        }, 3000);
      } catch (error) {
        console.error("Error fetching room statuses:", error);
        setError("Failed to load room statuses. Please try again.");
        setLoading(false);

        // Set default statuses as fallback
        const fallbackStatuses: RoomStatus[] = [
          "lunch hall (Capacity: 15)",
          "meeting room (Capacity: 10)",
          "Balcony (Capacity: 8)",
          "sit out (Capacity: 6)",
          "conference room",
          "boardroom",
        ].map((room) => ({
          room,
          status: "free",
          currentMeetings: [],
        }));
        setRoomStatuses(fallbackStatuses);
      }
    };

    fetchRoomStatuses();

    // Refresh every minute for real-time updates
    const interval = setInterval(fetchRoomStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter rooms and sort by status (busy first, then free)
  const filteredRooms = roomStatuses
    .filter((room) =>
      room.room.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort busy first, then free
      if (a.status === "busy" && b.status === "free") return -1;
      if (a.status === "free" && b.status === "busy") return 1;
      return 0;
    });

  // Calculate statistics
  const totalRooms = roomStatuses.length;
  const busyRooms = roomStatuses.filter((r) => r.status === "busy").length;
  const freeRooms = roomStatuses.filter((r) => r.status === "free").length;

  return (
    <div className="all-rooms">
      {initialLoading ? (
        <div className="initial-loading">
          <div className="loading-slider">
            <div className="slider-content">
              <h2>Loading Room Status...</h2>
              <div className="slider-bar">
                <div className="slider-progress"></div>
              </div>
              <p>Fetching real-time room data...</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Removed header, stats, last-updated, and footer sections */}
          <div className="table-container">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Room Name</th>
                  <th>Status</th>
                  <th>Current Meeting</th>
                  <th>Attendees</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="loading-cell">
                      <div className="loading-spinner">
                        Loading room statuses...
                      </div>
                    </td>
                  </tr>
                ) : filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-results">
                      <div>No rooms found matching your search.</div>
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room, index) => (
                    <tr key={index} className="room-row">
                      <td className="row-number">{index + 1}</td>
                      <td className="room-name">{room.room}</td>
                      <td className={`status ${room.status}`}>
                        {room.status === "busy" ? "Occupied" : "Available"}
                      </td>
                      <td className="meeting-info">
                        {room.status === "busy" &&
                        room.currentMeetings &&
                        room.currentMeetings.length > 0 ? (
                          <div className="meeting-details">
                            <div className="meeting-title">
                              {room.currentMeetings[0].title} (
                              {room.currentMeetings[0].teamName})
                            </div>
                            <div className="meeting-time">
                              {room.currentMeetings[0].endTime
                                .split(".")[0]
                                .replace("T", " ")}
                            </div>
                          </div>
                        ) : (
                          "No meetings"
                        )}
                      </td>
                      <td className="attendees">
                        {room.status === "busy" &&
                        room.currentMeetings &&
                        room.currentMeetings.length > 0 ? (
                          <div className="attendees-info">
                            <div className="attendees-count">
                              {room.currentMeetings[0].attendeesCount} people
                            </div>
                            <div className="attendees-list">
                              {room.currentMeetings[0].attendees
                                .slice(0, 3)
                                .join(", ")}
                              {room.currentMeetings[0].attendees.length > 3 &&
                                "..."}
                            </div>
                          </div>
                        ) : (
                          "No attendees"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AllRooms;
