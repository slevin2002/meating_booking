import React, { useState, useEffect, useMemo } from "react";
import "./AllEmployees.css";
import { API_CONFIG } from "../config/api";

interface Team {
  _id: string;
  name: string;
  project: string;
  lead: string;
  members: string[];
  status: string;
  color: string;
}

interface EmployeeStatus {
  name: string;
  status: "busy" | "free" | "loading";
  meetings?: Array<{
    title: string;
    startTime: string;
    endTime: string;
    teamName: string;
    room?: string;
    duration?: number;
  }>;
}

interface AllEmployeesProps {
  teams: Team[];
}

const AllEmployees: React.FC<AllEmployeesProps> = ({ teams }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // Get all unique employees
  const allEmployees = useMemo(() => {
    return teams
      .flatMap((team) => [
        team.lead,
        ...team.members.filter((member) => member !== team.lead),
      ])
      .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates
  }, [teams]);

  // Update current time every minute for countdown
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timeInterval);
  }, []);

  // Check employee availability using the all-employees endpoint
  useEffect(() => {
    if (!allEmployees || allEmployees.length === 0) {
      console.log("No employees to check.");
      setLoading(false);
      return;
    }

    const fetchAllEmployeeStatuses = async () => {
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

        const apiUrl = `${API_CONFIG.BASE_URL}/api/status/all-employees?date=${currentDate}&time=${currentTime}`;
        console.log("FETCHING ALL EMPLOYEES STATUS:", apiUrl);

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received employee statuses:", data);

        // Transform the data to match our interface
        const transformedStatuses: EmployeeStatus[] = data.employeeStatuses.map(
          (emp: any) => ({
            name: emp.name,
            status: emp.status,
            meetings: emp.meetings || [],
          })
        );

        setEmployeeStatuses(transformedStatuses);
        setLastUpdated(new Date());
        setLoading(false);

        // Removed initial loading timeout
      } catch (error) {
        console.error("Error fetching employee statuses:", error);
        setError("Failed to load employee statuses. Please try again.");
        setLoading(false);

        // Set default statuses as fallback
        const fallbackStatuses: EmployeeStatus[] = allEmployees.map((emp) => ({
          name: emp,
          status: "free",
          meetings: [],
        }));
        setEmployeeStatuses(fallbackStatuses);
      }
    };

    fetchAllEmployeeStatuses();

    // Refresh every minute for real-time updates
    const interval = setInterval(fetchAllEmployeeStatuses, 60000);
    return () => clearInterval(interval);
  }, [allEmployees]);

  // Filter employees and sort by status (busy first, then free)
  const filteredEmployees = employeeStatuses
    .filter((employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort busy first, then free
      if (a.status === "busy" && b.status === "free") return -1;
      if (a.status === "free" && b.status === "busy") return 1;
      return 0;
    });

  // Helper function to check if employee is about to be free (within 5 minutes)
  const isAboutToBeFree = (meetings: EmployeeStatus["meetings"]) => {
    if (!meetings || meetings.length === 0) return false;

    const now = new Date();
    const today = now.toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format

    // Parse the end time and convert to local time for comparison
    const [endHour, endMinute] = meetings[0].endTime.split(":").map(Number);
    const endDate = new Date(today);
    endDate.setHours(endHour, endMinute, 0, 0);

    // Convert UTC time to local time for comparison
    const endTimeLocal = new Date(
      endDate.getTime() - endDate.getTimezoneOffset() * 60000
    );

    const diffMs = endTimeLocal.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / (1000 * 60));

    return diffMins <= 5 && diffMins > 0;
  };

  // Calculate statistics
  const totalEmployees = employeeStatuses.length;
  const busyEmployees = employeeStatuses.filter(
    (e) => e.status === "busy"
  ).length;
  const freeEmployees = employeeStatuses.filter(
    (e) => e.status === "free"
  ).length;

  return (
    <div className="all-employees">
      {
        <>
          {/* Removed header, stats, and last-updated sections */}
          <div className="table-container">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee Name</th>
                  <th>Status</th>
                  <th>Project</th>
                  <th>Current Meetings</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="loading-cell">
                      <div className="loading-spinner">
                        Loading employee statuses...
                      </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-results">
                      <div>No employees found matching your search.</div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <tr key={index} className="employee-row">
                      <td className="row-number">{index + 1}</td>
                      <td className="employee-name">{employee.name}</td>
                      <td
                        className={`status ${employee.status} ${
                          isAboutToBeFree(employee.meetings)
                            ? "about-to-be-free"
                            : ""
                        }`}
                      >
                        {employee.status === "busy" ? (
                          <span className="status-busy">
                            {isAboutToBeFree(employee.meetings)
                              ? "Almost Free"
                              : "Busy"}
                            {employee.meetings &&
                              employee.meetings.length > 0 && (
                                <>
                                  {" "}
                                  &nbsp; endTime :{" "}
                                  {employee.meetings[0].endTime
                                    .split(".")[0]
                                    .replace("T", " ")}{" "}
                                </>
                              )}
                          </span>
                        ) : (
                          "Free"
                        )}
                      </td>
                      <td className="project">
                        {employee.status === "busy" &&
                        employee.meetings &&
                        employee.meetings.length > 0
                          ? employee.meetings[0].teamName
                          : "No Project"}
                      </td>
                      <td className="meetings">
                        {employee.status === "busy" &&
                        employee.meetings &&
                        employee.meetings.length > 0 ? (
                          <div className="meeting-info">
                            {employee.meetings.map((meeting, idx) => (
                              <div key={idx} className="meeting-item">
                                <div className="meeting-room">
                                  {meeting.room || "No Room"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          "No meetings"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      }
    </div>
  );
};

export default AllEmployees;
