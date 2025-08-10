import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import api from "../api/axios";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    [k: string]: any;
  };
}

type ClassTime = {
  id: string;
  dayOfWeek: number; // 0..6 (Sun..Sat)
  startMinutes: number; // 0..1440
  endMinutes: number; // 0..1440
};

type ClassRow = {
  id: string;
  name: string;
  description?: string;
  startAt?: string | null;
  endAt?: string | null;
  teacher?: {
    user?: { firstName?: string; lastName?: string; email?: string };
  };
  classTimes?: ClassTime[];
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad2 = (n: number) => String(n).padStart(2, "0");
const mmToHHMM = (mins: number) =>
  `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
const setHM = (d: Date, minutes: number) => {
  const x = new Date(d);
  x.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return x;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const viewRangeRef = useRef<{ start: Date; end: Date } | null>(null);

  const calendarsEvents = {
    Danger: "danger",
    Success: "success",
    Primary: "primary",
    Warning: "warning",
  };

  // Fetch classes (with classTimes)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/classes");
        const list: ClassRow[] = data?.items ?? data ?? [];
        setClasses(list);
        // if we already know current visible range, build immediately
        if (viewRangeRef.current) {
          setEvents(
            buildScheduleEvents(
              viewRangeRef.current.start,
              viewRangeRef.current.end,
              list
            )
          );
        }
      } catch {
        setClasses([]);
        setEvents([]);
      }
    })();
  }, []);

  // Build visible events from classTimes
  const buildScheduleEvents = (
    rangeStart: Date,
    rangeEnd: Date,
    classList: ClassRow[] | null
  ) => {
    if (!classList || !classList.length) return [] as CalendarEvent[];
    const out: CalendarEvent[] = [];

    for (const cls of classList) {
      const times = cls.classTimes ?? [];
      if (!times.length) continue;

      const courseStart = cls.startAt ? new Date(cls.startAt) : null;
      const courseEnd = cls.endAt ? new Date(cls.endAt) : null;

      for (const t of times) {
        // first occurrence in the visible range on the requested weekday
        const first = new Date(rangeStart);
        const delta = (t.dayOfWeek - first.getDay() + 7) % 7;
        first.setDate(first.getDate() + delta);

        for (let d = new Date(first); d <= rangeEnd; d = addDays(d, 7)) {
          const s = setHM(d, t.startMinutes);
          const e = setHM(d, t.endMinutes);

          // respect overall course window if provided (but not for labeling)
          if (courseStart && e < courseStart) continue;
          if (courseEnd && s > courseEnd) continue;

          const label = `${cls.name} — ${dayNames[t.dayOfWeek]} ${mmToHHMM(
            t.startMinutes
          )}–${mmToHHMM(t.endMinutes)}`;
          out.push({
            id: `${cls.id}-${t.id}-${+s}`, // any unique id is fine
            title: cls.name, // ⬅️ title only, like “test event”
            start: s, // ⬅️ pass Date objects (local)
            end: e, // ⬅️ pass Date objects (local)
            extendedProps: {
              calendar: "Primary",
              classId: cls.id,
              timeId: t.id,
              teacher: cls.teacher?.user?.email,
              description: cls.description,
            },
          });
        }
      }
    }
    return out;
  };

  // FullCalendar visible range changed => rebuild from schedule
  const handleDatesSet = (arg: any) => {
    const range = { start: arg.start, end: arg.end };
    viewRangeRef.current = range;
    setEvents(buildScheduleEvents(range.start, range.end, classes));
  };

  // Keep your existing modal flows for ad-hoc events (optional)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel((event.extendedProps as any)?.calendar || "Primary");
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    if (selectedEvent) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selectedEvent.id
            ? {
                ...e,
                title: eventTitle,
                start: eventStartDate,
                end: eventEndDate,
                extendedProps: { calendar: eventLevel },
              }
            : e
        )
      );
    } else {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        start: eventStartDate,
        end: eventEndDate,
        allDay: true,
        extendedProps: { calendar: eventLevel },
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
  };

  return (
    <>
      <PageMeta title="Calendar" description="Weekly class schedule calendar" />
      <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth" // show weekly times nicely
            headerToolbar={{
              left: "prev,next today addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="22:30:00"
            events={events}
            datesSet={handleDatesSet} // ⬅️ build from ClassTime per visible range
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: { text: "Add Event +", click: openModal },
            }}
          />
        </div>
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on
                track
              </p>
            </div>
            <div className="mt-8">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div className="mt-6">
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Color
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div
                        className={`form-check form-check-${value} form-check-inline`}
                      >
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span
                                className={`h-2 w-2 rounded-full bg-white ${
                                  eventLevel === key ? "block" : "hidden"
                                }`}
                              />
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter Start Date
                </label>
                <div className="relative">
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter End Date
                </label>
                <div className="relative">
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Close
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent ? "Update Changes" : "Add Event"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const level = String(
    eventInfo.event.extendedProps.calendar || "Primary"
  ).toLowerCase();
  const colorClass = `fc-bg-${level}`;
  const isMonth = eventInfo.view.type.includes("dayGrid"); // month view

  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      {/* In month view, hide the time so it's a simple chip like your test event */}
      {!isMonth && <div className="fc-event-time">{eventInfo.timeText}</div>}
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
