import React, { useState, useEffect } from "react";
import studentsData from "./data/students.json";
import facultyData from "./data/faculty.json";
import initialSeed from "./data/visits.json";

const STORAGE_KEY = "campus-faculty-visit-portal-v5";

const reasonOptions = [
  "Project Review",
  "Doubt Clarification",
  "Internship / LOR",
  "Attendance / Leave",
  "Exam / Marks Query",
  "Lab / Research Help",
  "Other"
];

function buildInitialVisits() {
  const now = Date.now();
  return initialSeed.visits.map((v, idx) => ({
    ...v,
    createdAt: now - (idx + 1) * 1000 * 60 * 25,
    expiresAt: now + 86400000
  }));
}

function buildInitialNotifications() {
  const now = Date.now();
  return initialSeed.notifications.map((n, idx) => ({
    ...n,
    time: now - (idx + 1) * 1000 * 60 * 20
  }));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (
      !Array.isArray(data.visits) ||
      !Array.isArray(data.faculty) ||
      !Array.isArray(data.notifications)
    ) {
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "Recently";
  const mins = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
}

function getAlternateAdvisors(facultyList, visit) {
  return facultyList
    .filter(
      (f) =>
        f.name !== visit.facultyName &&
        f.topics.some((t) => t.toLowerCase() === visit.reason.toLowerCase())
    )
    .slice(0, 2);
}

function VisitItem({
  visit,
  role,
  currentUser,
  facultyList,
  onSendReply,
  onChangeStatus
}) {
  const [replyText, setReplyText] = useState("");
  const [editingReply, setEditingReply] = useState(false);

  const isMyVisitAsStudent =
    role === "student" && visit.studentName === currentUser;
  const isMyVisitAsFaculty =
    role === "faculty" && visit.facultyName === currentUser;

  const alternateAdvisors = getAlternateAdvisors(facultyList, visit);

  function submitReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendReply(visit, replyText.trim());
    setReplyText("");
    setEditingReply(false);
  }

  function sendQuickReply(msg) {
    onSendReply(visit, msg);
    setReplyText("");
    setEditingReply(false);
  }

  return (
    <div className="visit-row">
      <div className="visit-row-top">
        <div className="visit-who">
          {role === "faculty" ? (
            <span>
              Student: <strong>{visit.studentName}</strong> (
              {visit.studentRoll || "Student"})
            </span>
          ) : (
            <span>
              To Faculty: <strong>{visit.facultyName}</strong> ({visit.location})
            </span>
          )}
          <span className="dot-sep">·</span>
          <span>
            Reason: <strong>{visit.reason}</strong>
          </span>
          <span className="dot-sep">·</span>
          <span className="time-label">{formatTimeAgo(visit.createdAt)}</span>
        </div>

        <div className="visit-tags">
          <span className={`tag urgency-${visit.urgency.toLowerCase()}`}>
            {visit.urgency}
          </span>
          <span
            className={`tag status-${visit.status
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            {visit.status}
          </span>
        </div>
      </div>

      <h3 className="visit-title">{visit.title}</h3>
      <p className="visit-desc">{visit.description}</p>

      <div className="visit-meta-line">
        <span>Cabin Visited: {visit.location}</span>
        <span>
          Student: {visit.studentName} ({visit.studentRoll})
        </span>
      </div>

      {visit.facultyReply ? (
        <div className="teacher-reply-box">
          <div className="teacher-reply-header">
            Reply from {visit.facultyName}:
          </div>
          <div className="teacher-reply-text">{visit.facultyReply}</div>
        </div>
      ) : (
        role === "student" && (
          <div className="waiting-note">
            No reply from {visit.facultyName} yet. You will get a notification when the faculty replies.
            {alternateAdvisors.length > 0 && (
              <div className="alt-advisor-line">
                Alternate faculty for {visit.reason}:{" "}
                {alternateAdvisors.map((a) => `${a.name} (${a.cabin})`).join(", ")}
              </div>
            )}
          </div>
        )
      )}

      {/* STUDENT ACTIONS: Can only withdraw their own open visit or mark met */}
      {isMyVisitAsStudent && (
        <div className="visit-actions">
          {visit.status === "Pending Reply" && (
            <button
              type="button"
              className="btn-secondary btn-small"
              onClick={() => onChangeStatus(visit, "Cancelled")}
            >
              Withdraw Visit Note
            </button>
          )}
          {visit.status === "Replied" && (
            <button
              type="button"
              className="btn-primary btn-small"
              onClick={() => onChangeStatus(visit, "Completed")}
            >
              Mark Met with Faculty
            </button>
          )}
        </div>
      )}

      {/* FACULTY ACTIONS: Only the authenticated faculty for this cabin can reply */}
      {isMyVisitAsFaculty &&
        visit.status !== "Cancelled" &&
        visit.status !== "Expired" && (
          <div className="faculty-action-area">
            {visit.status === "Pending Reply" || editingReply ? (
              <form className="faculty-reply-form" onSubmit={submitReply}>
                <div className="quick-replies">
                  <span>Quick reply:</span>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() =>
                      sendQuickReply(
                        `I am back in ${visit.location} now. You can come in.`
                      )
                    }
                  >
                    I am in cabin now
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() =>
                      sendQuickReply(
                        `I have a lecture right now. Come to ${visit.location} at 3:00 PM today.`
                      )
                    }
                  >
                    Come at 3:00 PM today
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() =>
                      sendQuickReply(
                        `Please meet me tomorrow morning at 10:30 AM in ${visit.location}.`
                      )
                    }
                  >
                    Tomorrow 10:30 AM
                  </button>
                </div>

                <div className="reply-input-group">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Write a reply to ${visit.studentName} regarding ${visit.reason}...`}
                  />
                  <button type="submit" className="btn-primary">
                    Send Reply
                  </button>
                  {editingReply && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditingReply(false)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="visit-actions">
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={() => {
                    setReplyText(visit.facultyReply);
                    setEditingReply(true);
                  }}
                >
                  Edit Reply
                </button>
                {visit.status === "Replied" && (
                  <button
                    type="button"
                    className="btn-primary btn-small"
                    onClick={() => onChangeStatus(visit, "Completed")}
                  >
                    Mark Meeting Completed
                  </button>
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export default function App() {
  const saved = loadFromStorage();

  const [visits, setVisits] = useState(
    saved ? saved.visits : buildInitialVisits()
  );
  const [faculty, setFaculty] = useState(
    saved ? saved.faculty : facultyData
  );
  const [notifications, setNotifications] = useState(
    saved ? saved.notifications : buildInitialNotifications()
  );

  // Separate authenticated accounts for both Student and Faculty
  const [role, setRole] = useState("student");
  const [authenticatedStudent, setAuthenticatedStudent] = useState(
    studentsData[0]
  );
  const [authenticatedFaculty, setAuthenticatedFaculty] = useState(null);

  // Authentication Modal state (used for both Student ID login and Faculty Key login)
  const [authModalType, setAuthModalType] = useState(null); // "student" | "faculty" | null
  const [selectedPersonToAuth, setSelectedPersonToAuth] = useState("");
  const [enteredAuthKey, setEnteredAuthKey] = useState("");
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState("visits");
  const [showNotifBox, setShowNotifBox] = useState(false);
  const [notifReplyMap, setNotifReplyMap] = useState({});
  const [statusMessage, setStatusMessage] = useState("");

  // Filters
  const [reasonFilter, setReasonFilter] = useState("All reasons");
  const [urgencyFilter, setUrgencyFilter] = useState("Any urgency");
  const [searchText, setSearchText] = useState("");

  // Student form state
  const [formData, setFormData] = useState({
    facultyName: facultyData[0].name,
    reason: "Project Review",
    title: "",
    description: "",
    urgency: "Normal",
    location: facultyData[0].cabin
  });

  const currentUser =
    role === "faculty" && authenticatedFaculty
      ? authenticatedFaculty.name
      : authenticatedStudent
      ? authenticatedStudent.name
      : "";

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ visits, faculty, notifications })
    );
  }, [visits, faculty, notifications]);

  // Sync changes across open browser tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed.visits)) setVisits(parsed.visits);
        if (Array.isArray(parsed.faculty)) setFaculty(parsed.faculty);
        if (Array.isArray(parsed.notifications)) {
          setNotifications(parsed.notifications);
        }
      } catch (err) {
        // ignore invalid storage payload
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Auto-expire visits older than 24 hours
  useEffect(() => {
    function checkExpiry() {
      setVisits((prev) => {
        const now = Date.now();
        const expired = prev.filter(
          (v) =>
            (v.status === "Pending Reply" || v.status === "Replied") &&
            v.expiresAt <= now
        );
        if (expired.length === 0) return prev;
        const expiredIds = new Set(expired.map((v) => v.id));
        return prev.map((v) =>
          expiredIds.has(v.id) ? { ...v, status: "Expired" } : v
        );
      });
    }
    checkExpiry();
    const timer = window.setInterval(checkExpiry, 30000);
    return () => window.clearInterval(timer);
  }, []);

  function showFlash(msg) {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);
  }

  // Open Student Login Gate (Requires Student ID / Key)
  function openStudentAuthGate(preselectedStudentName) {
    setAuthModalType("student");
    setSelectedPersonToAuth(preselectedStudentName || studentsData[0].name);
    setEnteredAuthKey("");
    setAuthError("");
    setShowNotifBox(false);
  }

  // Open Faculty Login Gate (Requires Faculty Key)
  function openFacultyAuthGate(preselectedFacultyName) {
    setAuthModalType("faculty");
    setSelectedPersonToAuth(preselectedFacultyName || facultyData[0].name);
    setEnteredAuthKey("");
    setAuthError("");
    setShowNotifBox(false);
  }

  // Verify Student ID or Faculty Key from separate JSON files
  function handleAuthSubmit(e) {
    e.preventDefault();
    const trimmedKey = enteredAuthKey.trim().toUpperCase();

    if (authModalType === "student") {
      const targetStudent = studentsData.find(
        (s) => s.name === selectedPersonToAuth
      );

      if (
        !targetStudent ||
        targetStudent.studentId.toUpperCase() !== trimmedKey
      ) {
        setAuthError(
          `Invalid Student ID for ${selectedPersonToAuth}. Each student account is private and requires the student's own ID.`
        );
        return;
      }

      setAuthenticatedStudent(targetStudent);
      setAuthenticatedFaculty(null);
      setRole("student");
      setAuthModalType(null);
      setEnteredAuthKey("");
      setAuthError("");
      setActiveTab("visits");
      showFlash(
        `Logged in as Student: ${targetStudent.name} (${targetStudent.studentId}).`
      );
      return;
    }

    if (authModalType === "faculty") {
      const targetFaculty = facultyData.find(
        (f) => f.name === selectedPersonToAuth
      );

      if (
        !targetFaculty ||
        targetFaculty.authKey.toUpperCase() !== trimmedKey
      ) {
        setAuthError(
          `Invalid Authentication Key for ${selectedPersonToAuth}. Students or other users cannot open this faculty account.`
        );
        return;
      }

      setAuthenticatedFaculty(targetFaculty);
      setRole("faculty");
      setAuthModalType(null);
      setEnteredAuthKey("");
      setAuthError("");
      setActiveTab("visits");
      showFlash(`Authenticated as Faculty: ${targetFaculty.name}.`);
    }
  }

  // STUDENT ONLY: Raise a cabin visit notification to a particular faculty
  function handleStudentRaiseVisit(e) {
    e.preventDefault();
    if (role !== "student" || !authenticatedStudent) return;

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.location.trim()
    ) {
      showFlash("Please fill in the visit subject, note, and cabin location.");
      return;
    }

    const now = Date.now();

    const newVisit = {
      id: now,
      facultyName: formData.facultyName,
      reason: formData.reason,
      title: formData.title.trim(),
      description: formData.description.trim(),
      urgency: formData.urgency,
      location: formData.location.trim(),
      studentName: authenticatedStudent.name,
      studentRoll: authenticatedStudent.rollNo,
      status: "Pending Reply",
      facultyReply: "",
      repliedAt: null,
      createdAt: now,
      expiresAt: now + 86400000
    };

    const newNotice = {
      id: now + Math.random(),
      visitId: now,
      toUser: newVisit.facultyName,
      fromUser: authenticatedStudent.name,
      reason: newVisit.reason,
      title: `${authenticatedStudent.name} (${authenticatedStudent.rollNo}) visited your cabin`,
      message: `Reason: ${newVisit.reason} — "${newVisit.description}"`,
      replyText: "",
      read: false,
      time: now
    };

    setVisits((prev) => [newVisit, ...prev]);
    setNotifications((prev) => [newNotice, ...prev]);

    setFormData({
      ...formData,
      title: "",
      description: "",
      urgency: "Normal"
    });
    setActiveTab("visits");
    showFlash(`Visit notification sent to ${newVisit.facultyName}.`);
  }

  // FACULTY ONLY: Only the authenticated faculty member can reply to visits for their cabin
  function handleFacultyReply(visit, replyMessage) {
    if (
      role !== "faculty" ||
      !authenticatedFaculty ||
      visit.facultyName !== authenticatedFaculty.name
    ) {
      showFlash("Unauthorized: Only the authenticated faculty can reply.");
      return;
    }

    const now = Date.now();

    setVisits((prev) =>
      prev.map((v) =>
        v.id === visit.id
          ? {
              ...v,
              status: "Replied",
              facultyReply: replyMessage,
              repliedAt: now
            }
          : v
      )
    );

    const studentNotice = {
      id: now + Math.random(),
      visitId: visit.id,
      toUser: visit.studentName,
      fromUser: authenticatedFaculty.name,
      reason: visit.reason,
      title: `${authenticatedFaculty.name} replied to your cabin visit (${visit.reason})`,
      message: replyMessage,
      replyText: replyMessage,
      read: false,
      time: now
    };

    setNotifications((prev) => [
      studentNotice,
      ...prev.map((n) =>
        n.visitId === visit.id && n.toUser === authenticatedFaculty.name
          ? { ...n, read: true, replyText: replyMessage }
          : n
      )
    ]);

    showFlash(`Reply sent to ${visit.studentName}.`);
  }

  function handleReplyFromNotification(e, notice) {
    e.preventDefault();
    const text = (notifReplyMap[notice.id] || "").trim();
    if (!text) return;

    const targetVisit = visits.find((v) => v.id === notice.visitId);
    if (targetVisit) {
      handleFacultyReply(targetVisit, text);
    }
    setNotifReplyMap((prev) => ({ ...prev, [notice.id]: "" }));
  }

  function handleChangeStatus(visit, nextStatus) {
    if (!window.confirm(`Mark this visit as ${nextStatus}?`)) return;

    setVisits((prev) =>
      prev.map((v) => (v.id === visit.id ? { ...v, status: nextStatus } : v))
    );

    const targetRecipient =
      role === "student" ? visit.facultyName : visit.studentName;

    setNotifications((prev) => [
      {
        id: Date.now() + Math.random(),
        visitId: visit.id,
        toUser: targetRecipient,
        fromUser: currentUser,
        reason: visit.reason,
        title: `Cabin visit marked ${nextStatus} by ${currentUser}`,
        message: `"${visit.title}" (${visit.reason})`,
        replyText: visit.facultyReply || "",
        read: false,
        time: Date.now()
      },
      ...prev
    ]);

    showFlash(`Visit marked as ${nextStatus}.`);
  }

  // Faculty updates their own cabin availability
  function handleUpdateMyAvailability(newAvailability) {
    if (role !== "faculty" || !authenticatedFaculty) return;
    setFaculty((prev) =>
      prev.map((f) =>
        f.name === authenticatedFaculty.name
          ? { ...f, availability: newAvailability }
          : f
      )
    );
    showFlash(`Cabin status updated to "${newAvailability}".`);
  }

  function handleResetDemo() {
    if (
      !window.confirm(
        "Reset all cabin visits and replies back to sample JSON data?"
      )
    ) {
      return;
    }
    setVisits(buildInitialVisits());
    setFaculty(facultyData);
    setNotifications(buildInitialNotifications());
    setReasonFilter("All reasons");
    setUrgencyFilter("Any urgency");
    setSearchText("");
    showFlash("Demo data restored from JSON files.");
  }

  // Strictly person-specific notifications
  const myNotifications = notifications.filter((n) => n.toUser === currentUser);
  const myUnreadCount = myNotifications.filter((n) => !n.read).length;

  // Strictly person-specific visits:
  // - If Student: ONLY visits raised by this authenticated student
  // - If Faculty: ONLY visits raised to this authenticated faculty member
  const personSpecificVisits = visits.filter((v) =>
    role === "student"
      ? authenticatedStudent && v.studentName === authenticatedStudent.name
      : authenticatedFaculty && v.facultyName === authenticatedFaculty.name
  );

  const filteredVisits = personSpecificVisits.filter((v) => {
    const matchesReason =
      reasonFilter === "All reasons" || v.reason === reasonFilter;
    const matchesUrgency =
      urgencyFilter === "Any urgency" || v.urgency === urgencyFilter;
    const text =
      `${v.title} ${v.description} ${v.facultyName} ${v.studentName} ${v.reason} ${v.location} ${v.facultyReply || ""}`.toLowerCase();
    const matchesSearch = text.includes(searchText.toLowerCase());
    return matchesReason && matchesUrgency && matchesSearch;
  });

  const currentFacultyObj =
    authenticatedFaculty &&
    faculty.find((f) => f.name === authenticatedFaculty.name);

  const pendingCount = personSpecificVisits.filter(
    (v) => v.status === "Pending Reply"
  ).length;
  const repliedCount = personSpecificVisits.filter(
    (v) => v.status === "Replied"
  ).length;
  const completedCount = personSpecificVisits.filter(
    (v) => v.status === "Completed"
  ).length;

  return (
    <div className="portal-page">
      {/* Top Bar */}
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="brand-block">
            <h1>Faculty Cabin Visit &amp; Student Coordination</h1>
            <p>
              {role === "student"
                ? `Student Portal — Authenticated as ${authenticatedStudent?.name} (ID: ${authenticatedStudent?.studentId} · ${authenticatedStudent?.branch})`
                : `Faculty Cabin Portal — Authenticated as ${authenticatedFaculty?.name} (${currentFacultyObj?.cabin || ""})`}
            </p>
          </div>

          <div className="identity-bar">
            {role === "student" ? (
              <>
                <span className="locked-faculty-badge">
                  Student: <strong>{authenticatedStudent?.name}</strong> (
                  {authenticatedStudent?.studentId})
                </span>
                <button
                  type="button"
                  className="logout-btn"
                  onClick={() => openStudentAuthGate(authenticatedStudent?.name)}
                >
                  Switch Student (Enter ID)
                </button>
                <button
                  type="button"
                  className="faculty-auth-btn"
                  onClick={() => openFacultyAuthGate(facultyData[0].name)}
                >
                  Faculty Login (Requires Key)
                </button>
              </>
            ) : (
              <>
                <span className="locked-faculty-badge">
                  Faculty: <strong>{authenticatedFaculty?.name}</strong> (Key Verified)
                </span>
                <button
                  type="button"
                  className="logout-btn"
                  onClick={() => openFacultyAuthGate(authenticatedFaculty?.name)}
                >
                  Switch Faculty (Enter Key)
                </button>
                <button
                  type="button"
                  className="faculty-auth-btn"
                  onClick={() =>
                    openStudentAuthGate(
                      authenticatedStudent?.name || studentsData[0].name
                    )
                  }
                >
                  Student Login (Enter ID)
                </button>
              </>
            )}

            <div className="notif-container">
              <button
                type="button"
                className="notif-trigger"
                onClick={() => setShowNotifBox(!showNotifBox)}
              >
                Inbox ({myUnreadCount})
              </button>

              {showNotifBox && (
                <div className="notif-panel">
                  <div className="notif-panel-head">
                    <strong>
                      {currentUser}&apos;s Notifications ({myUnreadCount} unread)
                    </strong>
                    <button
                      type="button"
                      className="plain-link"
                      onClick={() => setShowNotifBox(false)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="notif-panel-body">
                    {myNotifications.length === 0 ? (
                      <div className="notif-empty">
                        No notifications for {currentUser}.
                      </div>
                    ) : (
                      myNotifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-card ${n.read ? "read" : "unread"}`}
                        >
                          <div
                            onClick={() =>
                              setNotifications((prev) =>
                                prev.map((item) =>
                                  item.id === n.id
                                    ? { ...item, read: true }
                                    : item
                                )
                              )
                            }
                          >
                            <div className="notif-card-top">
                              <span>
                                From: <strong>{n.fromUser}</strong>
                              </span>
                              <span className="notif-reason">{n.reason}</span>
                            </div>
                            <div className="notif-card-title">{n.title}</div>
                            <div className="notif-card-msg">{n.message}</div>
                          </div>

                          {role === "faculty" && !n.replyText && n.visitId && (
                            <form
                              className="notif-inline-reply"
                              onSubmit={(e) => handleReplyFromNotification(e, n)}
                            >
                              <input
                                type="text"
                                value={notifReplyMap[n.id] || ""}
                                onChange={(e) =>
                                  setNotifReplyMap({
                                    ...notifReplyMap,
                                    [n.id]: e.target.value
                                  })
                                }
                                placeholder={`Reply to ${n.fromUser}...`}
                              />
                              <button type="submit" className="btn-primary btn-small">
                                Reply
                              </button>
                            </form>
                          )}

                          {n.replyText && role === "faculty" && (
                            <div className="notif-sent-note">
                              You replied: &ldquo;{n.replyText}&rdquo;
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {myNotifications.length > 0 && (
                    <div className="notif-panel-foot">
                      <button
                        type="button"
                        className="plain-link"
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((n) =>
                              n.toUser === currentUser ? { ...n, read: true } : n
                            )
                          )
                        }
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Authentication Modal for Student ID or Faculty Key */}
      {authModalType && (
        <div className="auth-modal-backdrop">
          <div className="auth-modal-box">
            <div className="auth-modal-header">
              <h2>
                {authModalType === "student"
                  ? "Student Authentication Required"
                  : "Faculty Authentication Required"}
              </h2>
              <button
                type="button"
                className="plain-link"
                onClick={() => setAuthModalType(null)}
              >
                Close
              </button>
            </div>

            <p className="auth-modal-desc">
              {authModalType === "student"
                ? "Each student account is separate and private. Select your name and enter your Student ID to view your cabin visits and faculty replies."
                : "Students cannot access faculty portals. Select the faculty member and enter their private authentication key to open their cabin account."}
            </p>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="field">
                <label>
                  {authModalType === "student"
                    ? "Select Student Name"
                    : "Select Particular Faculty"}
                </label>
                <select
                  value={selectedPersonToAuth}
                  onChange={(e) => {
                    setSelectedPersonToAuth(e.target.value);
                    setAuthError("");
                  }}
                >
                  {authModalType === "student"
                    ? studentsData.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.branch})
                        </option>
                      ))
                    : facultyData.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name} ({f.department})
                        </option>
                      ))}
                </select>
              </div>

              <div className="field">
                <label>
                  {authModalType === "student"
                    ? "Student ID / Roll Key"
                    : "Faculty Authentication Key"}
                </label>
                <input
                  type="password"
                  required
                  value={enteredAuthKey}
                  onChange={(e) => {
                    setEnteredAuthKey(e.target.value);
                    setAuthError("");
                  }}
                  placeholder={
                    authModalType === "student"
                      ? "Enter your Student ID..."
                      : "Enter secret key for selected faculty..."
                  }
                />
              </div>

              {authError && <div className="auth-error-msg">{authError}</div>}

              <div className="auth-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAuthModalType(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {authModalType === "student"
                    ? "Verify & Open Student Account"
                    : "Verify & Open Faculty Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="portal-main">
        {/* Left Column */}
        <aside className="side-column">
          {role === "student" ? (
            <div className="side-box">
              <h2>Notify Faculty About Cabin Visit</h2>
              <p className="side-help">
                Visited a faculty cabin and found them away? Submit your visit reason here. Only that particular faculty member will receive it in their private account.
              </p>

              <form className="visit-form" onSubmit={handleStudentRaiseVisit}>
                <div className="field">
                  <label>Particular Faculty Visited</label>
                  <select
                    value={formData.facultyName}
                    onChange={(e) => {
                      const selected = e.target.value;
                      const found = faculty.find((f) => f.name === selected);
                      setFormData({
                        ...formData,
                        facultyName: selected,
                        location: found ? found.cabin : formData.location
                      });
                    }}
                  >
                    {faculty.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name} ({f.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Reason for Visiting</label>
                  <select
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                  >
                    {reasonOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Cabin / Room Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                <div className="field">
                  <label>Urgency</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) =>
                      setFormData({ ...formData, urgency: e.target.value })
                    }
                  >
                    <option value="Urgent">Urgent (Today)</option>
                    <option value="Normal">Normal</option>
                    <option value="Whenever">Whenever Free</option>
                  </select>
                </div>

                <div className="field">
                  <label>Short Subject</label>
                  <input
                    type="text"
                    required
                    maxLength="90"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Came for Project Synopsis signature"
                  />
                </div>

                <div className="field">
                  <label>Note for Faculty</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Write what time you visited and what you need help with..."
                  />
                </div>

                <button type="submit" className="btn-primary full-btn">
                  Raise Cabin Visit Notification
                </button>
              </form>
            </div>
          ) : (
            <div className="side-box">
              <h2>Private Faculty Cabin Account</h2>
              {currentFacultyObj && (
                <div className="faculty-profile-info">
                  <p>
                    <strong>Faculty:</strong> {currentFacultyObj.name}
                  </p>
                  <p>
                    <strong>Department:</strong> {currentFacultyObj.department}
                  </p>
                  <p>
                    <strong>Cabin:</strong> {currentFacultyObj.cabin}
                  </p>
                  <p>
                    <strong>Handles:</strong> {currentFacultyObj.topics.join(", ")}
                  </p>

                  <div className="field" style={{ marginTop: "12px" }}>
                    <label>Update My Current Cabin Status</label>
                    <select
                      value={currentFacultyObj.availability}
                      onChange={(e) => handleUpdateMyAvailability(e.target.value)}
                    >
                      <option value="Available in Cabin">Available in Cabin</option>
                      <option value="In Lecture (Free at 2:30 PM)">
                        In Lecture (Free at 2:30 PM)
                      </option>
                      <option value="In Meeting (Free after 3:00 PM)">
                        In Meeting (Free after 3:00 PM)
                      </option>
                      <option value="Available Today">Available Today</option>
                      <option value="On Leave Today">On Leave Today</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="faculty-notice-box">
                <strong>Restricted Access Active</strong>
                <p>
                  You are logged into {authenticatedFaculty?.name}&apos;s private account. Other faculty visits and student accounts are hidden.
                </p>
              </div>
            </div>
          )}

          <div className="side-box">
            <h3>
              {role === "student"
                ? `${authenticatedStudent?.name}'s Visit Summary`
                : `Cabin Visits for ${authenticatedFaculty?.name}`}
            </h3>
            <ul className="count-list">
              <li>
                <span>Waiting for Reply:</span>
                <strong>{pendingCount}</strong>
              </li>
              <li>
                <span>Faculty Replied:</span>
                <strong>{repliedCount}</strong>
              </li>
              <li>
                <span>Completed Meetings:</span>
                <strong>{completedCount}</strong>
              </li>
            </ul>

            <button
              type="button"
              className="btn-secondary full-btn"
              style={{ marginTop: "10px" }}
              onClick={handleResetDemo}
            >
              Reset Sample Data
            </button>
          </div>
        </aside>

        {/* Right Column */}
        <section className="content-column">
          <div className="tab-bar">
            <button
              type="button"
              className={activeTab === "visits" ? "tab-link active" : "tab-link"}
              onClick={() => setActiveTab("visits")}
            >
              {role === "student"
                ? `My Raised Cabin Visits — ${authenticatedStudent?.name} (${personSpecificVisits.length})`
                : `Students Who Visited ${authenticatedFaculty?.name}'s Cabin (${personSpecificVisits.length})`}
            </button>
            <button
              type="button"
              className={activeTab === "directory" ? "tab-link active" : "tab-link"}
              onClick={() => setActiveTab("directory")}
            >
              Faculty Cabin Status &amp; Directory ({faculty.length})
            </button>
          </div>

          {activeTab === "visits" && (
            <div>
              <div className="filter-panel">
                <div className="reason-chips">
                  {["All reasons", ...reasonOptions.slice(0, 6)].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={
                        reasonFilter === r ? "reason-chip active" : "reason-chip"
                      }
                      onClick={() => setReasonFilter(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="search-row">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={
                      role === "student"
                        ? "Search your visits by faculty, reason, or reply..."
                        : "Search student visits to your cabin by student name, roll no, or reason..."
                    }
                  />
                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                  >
                    <option value="Any urgency">Any urgency</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Normal">Normal</option>
                    <option value="Whenever">Whenever</option>
                  </select>
                </div>
              </div>

              <div className="visits-list">
                {filteredVisits.length > 0 ? (
                  filteredVisits.map((v) => (
                    <VisitItem
                      key={v.id}
                      visit={v}
                      role={role}
                      currentUser={currentUser}
                      facultyList={faculty}
                      onSendReply={handleFacultyReply}
                      onChangeStatus={handleChangeStatus}
                    />
                  ))
                ) : (
                  <div className="empty-box">
                    {role === "student" ? (
                      <p>
                        No cabin visits found for {authenticatedStudent?.name} ({authenticatedStudent?.studentId}) matching this filter.
                      </p>
                    ) : (
                      <p>
                        No students have logged a missed visit to {authenticatedFaculty?.name}&apos;s cabin for this filter.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "directory" && (
            <div className="directory-box">
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Department &amp; Cabin</th>
                    <th>Reasons Handled</th>
                    <th>Current Cabin Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.map((f) => {
                    const isAvail = f.availability
                      .toLowerCase()
                      .includes("available");
                    return (
                      <tr key={f.id}>
                        <td>
                          <strong>{f.name}</strong>
                        </td>
                        <td>
                          <div>{f.department}</div>
                          <small>{f.cabin}</small>
                        </td>
                        <td>{f.topics.join(", ")}</td>
                        <td>
                          <span
                            className={
                              isAvail ? "avail-text yes" : "avail-text no"
                            }
                          >
                            {f.availability}
                          </span>
                        </td>
                        <td>
                          {role === "student" ? (
                            <div className="dir-actions">
                              <button
                                type="button"
                                className="btn-secondary btn-small"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    facultyName: f.name,
                                    reason: f.topics[0] || "Project Review",
                                    location: f.cabin
                                  });
                                  setActiveTab("visits");
                                  showFlash(
                                    `Selected ${f.name} in the cabin visit form.`
                                  );
                                }}
                              >
                                Notify Visit
                              </button>
                              <button
                                type="button"
                                className="plain-link"
                                onClick={() => openFacultyAuthGate(f.name)}
                              >
                                Faculty Login
                              </button>
                            </div>
                          ) : authenticatedFaculty?.name === f.name ? (
                            <span className="avail-text yes">Logged In</span>
                          ) : (
                            <button
                              type="button"
                              className="plain-link"
                              onClick={() => openFacultyAuthGate(f.name)}
                            >
                              Login with Key
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {statusMessage && (
        <div className="flash-message">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
