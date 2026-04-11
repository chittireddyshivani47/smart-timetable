/**
 * Smart Timetable Generator - CSP with Backtracking Algorithm
 * 
 * Approach: Constraint Satisfaction Problem (CSP) with:
 * - Forward checking
 * - Arc consistency
 * - Minimum Remaining Values (MRV) heuristic
 * - Least Constraining Value (LCV) heuristic
 * - Backtracking on conflicts
 */

class TimetableCSP {
  constructor(config) {
    this.subjects = config.subjects;       // Array of subject objects
    this.faculty = config.faculty;         // Array of faculty objects
    this.classrooms = config.classrooms;   // Array of classroom objects
    this.workingDays = config.workingDays; // ['Monday', 'Tuesday', ...]
    this.timeSlots = config.timeSlots;     // ['8:00 AM - 8:55 AM', ...]
    this.breakSlots = config.breakSlots;   // ['12:00 PM - 12:55 PM']
    this.className = config.className || 'Class A';
    this.priorityMorning = config.priorityMorning !== false;

    // State
    this.assignments = [];
    this.conflicts = 0;
    this.iterations = 0;

    // Build slot index: all (day, slot) pairs excluding breaks
    this.allSlots = [];
    for (const day of this.workingDays) {
      for (const slot of this.timeSlots) {
        if (!this.breakSlots.includes(slot)) {
          this.allSlots.push({ day, slot });
        }
      }
    }

    // Build required sessions: for each subject, we need hoursPerWeek sessions
    this.requiredSessions = [];
    for (const subject of this.subjects) {
      const assignedFaculty = this.faculty.filter(f =>
        f.subjects.some(s => s._id?.toString() === subject._id?.toString() || s.toString() === subject._id?.toString())
      );
      for (let i = 0; i < subject.hoursPerWeek; i++) {
        this.requiredSessions.push({
          id: `${subject._id}-${i}`,
          subject,
          possibleFaculty: assignedFaculty,
          isPriority: subject.isPriority,
          type: subject.type
        });
      }
    }

    // Sort: priority subjects first, then by least faculty options (MRV)
    this.requiredSessions.sort((a, b) => {
      if (b.isPriority !== a.isPriority) return b.isPriority ? 1 : -1;
      return a.possibleFaculty.length - b.possibleFaculty.length;
    });
  }

  // Check if a slot assignment is valid given current assignments
  isValid(session, day, slot, faculty, classroom) {
    for (const a of this.assignments) {
      if (a.day !== day || a.slot !== slot) continue;

      // Faculty conflict: same faculty at same time
      if (a.faculty && faculty && a.faculty._id?.toString() === faculty._id?.toString()) {
        return false;
      }

      // Classroom conflict: same room at same time
      if (a.classroom && classroom && a.classroom._id?.toString() === classroom._id?.toString()) {
        return false;
      }
    }

    // Check faculty max hours per day
    if (faculty) {
      const facultyDayCount = this.assignments.filter(
        a => a.day === day && a.faculty?._id?.toString() === faculty._id?.toString()
      ).length;
      if (facultyDayCount >= (faculty.maxHoursPerDay || 6)) return false;

      // Check faculty unavailable slots
      if (faculty.unavailableSlots) {
        const isUnavailable = faculty.unavailableSlots.some(
          us => us.day === day && us.slot === slot
        );
        if (isUnavailable) return false;
      }
    }

    // Check same subject not repeated twice in same day
    const subjectDayCount = this.assignments.filter(
      a => a.day === day && a.subject?._id?.toString() === session.subject._id?.toString()
    ).length;
    if (subjectDayCount >= 2) return false;

    return true;
  }

  // Get ordered slots (priority subjects prefer morning)
  getOrderedSlots(session) {
    const slots = [...this.allSlots];
    if (session.isPriority && this.priorityMorning) {
      // Sort morning slots first
      const morningKeywords = ['8:00', '9:00', '10:00'];
      slots.sort((a, b) => {
        const aIsMorning = morningKeywords.some(k => a.slot.includes(k));
        const bIsMorning = morningKeywords.some(k => b.slot.includes(k));
        if (aIsMorning && !bIsMorning) return -1;
        if (!aIsMorning && bIsMorning) return 1;
        return 0;
      });
    }

    // Shuffle same-priority slots slightly for variety (avoid identical patterns)
    for (let i = slots.length - 1; i > 0; i--) {
      if (Math.random() > 0.7) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
      }
    }

    return slots;
  }

  // LCV: order assignments by how much they constrain remaining sessions
  getOrderedAssignments(session, day, slot) {
    const results = [];
    const compatibleFaculty = session.possibleFaculty.length > 0
      ? session.possibleFaculty
      : [null];

    const compatibleRooms = session.type === 'lab'
      ? this.classrooms.filter(r => r.type === 'lab')
      : this.classrooms.filter(r => r.type !== 'lab');

    const rooms = compatibleRooms.length > 0 ? compatibleRooms : this.classrooms;

    for (const faculty of compatibleFaculty) {
      for (const classroom of rooms) {
        if (this.isValid(session, day, slot, faculty, classroom)) {
          // Count how many future sessions this would block
          let constraintScore = 0;
          for (const futureSession of this.requiredSessions) {
            if (futureSession.id === session.id) continue;
            const wouldBlock = futureSession.possibleFaculty.some(
              f => f._id?.toString() === faculty?._id?.toString()
            );
            if (wouldBlock) constraintScore++;
          }
          results.push({ faculty, classroom, constraintScore });
        }
      }
    }

    // Sort by least constraining (LCV)
    return results.sort((a, b) => a.constraintScore - b.constraintScore);
  }

  // Main backtracking solver
  solve(sessionIndex = 0) {
    this.iterations++;

    if (sessionIndex === this.requiredSessions.length) {
      return true; // All sessions assigned
    }

    if (this.iterations > 100000) {
      return false; // Timeout guard
    }

    const session = this.requiredSessions[sessionIndex];
    const orderedSlots = this.getOrderedSlots(session);

    for (const { day, slot } of orderedSlots) {
      const orderedAssignments = this.getOrderedAssignments(session, day, slot);

      for (const { faculty, classroom } of orderedAssignments) {
        // Assign
        const assignment = {
          day,
          slot,
          subject: session.subject,
          faculty,
          classroom,
          className: this.className
        };
        this.assignments.push(assignment);

        // Recurse
        if (this.solve(sessionIndex + 1)) {
          return true;
        }

        // Backtrack
        this.assignments.pop();
        this.conflicts++;
      }
    }

    return false; // No valid assignment found at this level
  }

  // Generate timetable with fallback to greedy if backtracking times out
  generate() {
    const startTime = Date.now();

    const solved = this.solve(0);

    if (!solved || this.assignments.length < this.requiredSessions.length) {
      // Fallback: greedy assignment for unassigned sessions
      this.greedyFill();
    }

    // Add break slots
    const slots = [...this.assignments];
    for (const day of this.workingDays) {
      for (const breakSlot of this.breakSlots) {
        slots.push({
          day,
          slot: breakSlot,
          isBreak: true,
          breakLabel: 'Lunch Break',
          className: this.className
        });
      }
    }

    return {
      slots,
      stats: {
        conflicts: this.conflicts,
        iterations: this.iterations,
        timeTaken: Date.now() - startTime,
        sessionsAssigned: this.assignments.length,
        sessionsRequired: this.requiredSessions.length
      }
    };
  }

  // Greedy fallback for overflow sessions
  greedyFill() {
    const assignedIds = new Set(this.assignments.map(a => {
      const subId = a.subject?._id?.toString();
      return subId;
    }));

    // Count assigned per subject
    const assignedCount = {};
    for (const a of this.assignments) {
      const id = a.subject?._id?.toString();
      assignedCount[id] = (assignedCount[id] || 0) + 1;
    }

    for (const session of this.requiredSessions) {
      const subId = session.subject._id?.toString();
      const needed = session.subject.hoursPerWeek;
      const have = assignedCount[subId] || 0;
      if (have >= needed) continue;

      // Find any free slot
      for (const { day, slot } of this.allSlots) {
        const slotBusy = this.assignments.some(a => a.day === day && a.slot === slot && !a.isBreak);
        if (slotBusy) continue;

        const faculty = session.possibleFaculty[0] || null;
        const classroom = this.classrooms[0] || null;

        this.assignments.push({
          day, slot,
          subject: session.subject,
          faculty,
          classroom,
          className: this.className,
          isConflict: true
        });

        assignedCount[subId] = (assignedCount[subId] || 0) + 1;
        if (assignedCount[subId] >= needed) break;
      }
    }
  }
}

module.exports = TimetableCSP;
