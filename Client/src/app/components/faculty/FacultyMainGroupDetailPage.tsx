import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Settings,
  ChevronLeft,
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  UsersRound,
  UserPlus,
  Plus,
  Search,
  GripVertical,
  GraduationCap,
  Sparkles,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import {
  addStudentToFacultySubGroup,
  deleteFacultyMainGroup,
  deleteFacultySubGroup,
  createFacultySubGroup,
  removeStudentFromFacultySubGroup,
  updateFacultyMainGroupName,
  updateFacultySubGroupName,
  listFacultyCourseGroups,
} from "../../../services/courseGroupService";
import { getFacultyClassHeaderById, listFacultyRosterRows } from "../../../services/classService";
import type { ClassHeader, FacultyRosterStudentRow } from "../../../types/class";
import type { MainGroupResponse, SubGroupResponse } from "../../../types/courseGroup";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

const STUDENT_DRAG_TYPE = "FACULTY_COURSE_GROUP_STUDENT";

interface DragStudentItem {
  studentId: number;
  fromSubGroupId?: number;
}

const SUBGROUP_ACCENTS = [
  { soft: "bg-[#5A7ACD]/08", icon: "text-[#5A7ACD]" },
  { soft: "bg-[#FEB05D]/10", icon: "text-[#D97706]" },
  { soft: "bg-emerald-500/08", icon: "text-emerald-600" },
  { soft: "bg-violet-500/08", icon: "text-violet-600" },
] as const;

function StudentsSidebar({
  students,
  search,
  onSearchChange,
  getFromSubGroupId,
  onUnassignDrop,
}: {
  students: Array<DraggableStudentRowModel & { key: string }>;
  search: string;
  onSearchChange: (value: string) => void;
  getFromSubGroupId: (studentId: number) => number | undefined;
  onUnassignDrop: (fromSubGroupId: number, studentId: number) => void;
}) {
  const [{ isOverUnassign, canDropUnassign }, unassignDropRef] = useDrop(
    () => ({
      accept: STUDENT_DRAG_TYPE,
      canDrop: (item: DragStudentItem) => Boolean(item.fromSubGroupId),
      drop: (item: DragStudentItem) => {
        if (!item.fromSubGroupId) return;
        onUnassignDrop(item.fromSubGroupId, item.studentId);
      },
      collect: (monitor) => ({
        isOverUnassign: monitor.isOver({ shallow: true }),
        canDropUnassign: monitor.canDrop(),
      }),
    }),
    [onUnassignDrop],
  );

  return (
    <aside className="flex w-full flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:w-[300px] xl:w-[320px]">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[#5A7ACD]" strokeWidth={2} />
          <span className="text-[14px] font-semibold text-[#2B2A2A]">Students</span>
          <span className="ml-auto rounded-full bg-[#5A7ACD]/10 px-2 py-0.5 text-[11px] font-semibold text-[#5A7ACD]">
            {students.length}
          </span>
        </div>
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            strokeWidth={2}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search students…"
            className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-2 pl-9 pr-3 text-[13px] outline-none ring-[#5A7ACD] focus:bg-white focus:ring-2"
          />
        </div>
      </div>
      <div
        ref={unassignDropRef}
        className={`min-h-[200px] flex-1 space-y-2 overflow-y-auto px-3 py-3 lg:max-h-[calc(100vh-280px)] ${
          isOverUnassign && canDropUnassign ? "bg-[#FAFBFF]" : ""
        }`}
      >
        {students.length === 0 ? (
          <p className="px-1 text-center text-[12px] text-gray-500">No students match your search.</p>
        ) : (
          students.map((row, idx) => (
            <DraggableStudentRow
              key={row.key}
              row={{ studentId: row.studentId, name: row.name, email: row.email }}
              accentIndex={idx}
              fromSubGroupId={getFromSubGroupId(row.studentId)}
              disabled={getFromSubGroupId(row.studentId) != null}
            />
          ))
        )}
      </div>
      <p className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-500">
        Drag a student here to remove them from their subgroup.
      </p>
    </aside>
  );
}

function getErrorMessage(error: unknown): string {
  return getApiErrorMessage(error, "Something went wrong. Please try again.");
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

type DraggableStudentRowModel = {
  studentId: number;
  name: string;
  email: string;
};

function NavItem({
  icon,
  label,
  active,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  to: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors
          ${active ? "bg-[#5A7ACD] text-white" : "text-gray-700 hover:bg-gray-100"}
        `}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}

function DraggableStudentRow({
  row,
  accentIndex,
  fromSubGroupId,
  onRemove,
  disabled,
}: {
  row: DraggableStudentRowModel;
  accentIndex: number;
  fromSubGroupId?: number;
  onRemove?: (() => void) | null;
  disabled?: boolean;
}) {
  const studentId = row.studentId;
  const isDisabled = Boolean(disabled);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: STUDENT_DRAG_TYPE,
      item: { studentId, fromSubGroupId } satisfies DragStudentItem,
      canDrag: !isDisabled,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [studentId, fromSubGroupId, isDisabled],
  );

  const avatarHue = accentIndex % SUBGROUP_ACCENTS.length;

  return (
    <div
      ref={drag}
      className={`
        flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-[13px]
        shadow-sm ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-grab active:cursor-grabbing"}
        ${isDragging ? "opacity-40" : ""}
      `}
    >
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${SUBGROUP_ACCENTS[avatarHue].soft} text-[#2B2A2A]`}
      >
        {initialsFromName(row.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-[#2B2A2A]">{row.name}</div>
        <div className="truncate text-[11px] text-gray-500">{row.email}</div>
      </div>
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove student from subgroup"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-[#2B2A2A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : null}
      <GripVertical className="h-4 w-4 flex-shrink-0 text-gray-300" strokeWidth={2} aria-hidden />
    </div>
  );
}

function SubGroupCard({
  sub,
  accentIndex,
  onDropStudent,
  onRemoveStudent,
  onEditSub,
  onDeleteSub,
  dropping,
}: {
  sub: SubGroupResponse;
  accentIndex: number;
  onDropStudent: (subGroupId: number, studentId: number, fromSubGroupId?: number) => Promise<void>;
  onRemoveStudent: (subGroupId: number, studentId: number) => Promise<void>;
  onEditSub: (sub: SubGroupResponse) => void;
  onDeleteSub: (subId: number) => void;
  dropping: boolean;
}) {
  const accent = SUBGROUP_ACCENTS[accentIndex % SUBGROUP_ACCENTS.length];
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: STUDENT_DRAG_TYPE,
      drop: (item: DragStudentItem) => {
        void onDropStudent(sub.id, item.studentId, item.fromSubGroupId);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [sub.id, onDropStudent],
  );

  return (
    <div
      ref={drop}
      className={`
        flex min-h-[220px] flex-col rounded-2xl border-2 border-dashed border-gray-300 bg-white p-4 transition-colors
        ${isOver && canDrop ? "border-gray-400 bg-[#FAFBFF] ring-2 ring-[#5A7ACD]/20" : ""}
      `}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-[#2B2A2A]">{sub.name}</h3>
            <p className="text-[11px] text-gray-500">
              {sub.students.length} student{sub.students.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Edit subgroup name"
            onClick={() => onEditSub(sub)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-[#2B2A2A]"
          >
            <Edit className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Delete subgroup"
            onClick={() => onDeleteSub(sub.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-[#C23A42]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="mb-3 min-h-[72px] flex-1 space-y-1.5 overflow-y-auto">
        {dropping ? (
          <p className="text-[12px] text-[#5A7ACD]">Adding…</p>
        ) : sub.students.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 py-6 text-center text-[12px] text-gray-500">
            Drop students here
          </p>
        ) : (
          sub.students.map((s, idx) => (
            <DraggableStudentRow
              key={s.id}
              row={{ studentId: s.id, name: s.name, email: s.email }}
              accentIndex={idx}
              fromSubGroupId={sub.id}
              onRemove={() => void onRemoveStudent(sub.id, s.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function FacultyMainGroupDetailPage() {
  const { classId, mainGroupId } = useParams();
  const navigate = useNavigate();
  const resolvedClassId = classId ?? "1";
  const parsedMainId = Number(mainGroupId ?? "0");

  const [classHeader, setClassHeader] = useState<ClassHeader | null>(null);
  const [mainGroup, setMainGroup] = useState<MainGroupResponse | null>(null);
  const [roster, setRoster] = useState<FacultyRosterStudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [droppingSubId, setDroppingSubId] = useState<number | null>(null);
  const [mainEditModalOpen, setMainEditModalOpen] = useState(false);
  const [mainEditName, setMainEditName] = useState("");
  const [mainDeleteModalOpen, setMainDeleteModalOpen] = useState(false);
  const [mainActionBusy, setMainActionBusy] = useState(false);
  const [subEditModalOpen, setSubEditModalOpen] = useState<null | number>(null);
  const [subEditName, setSubEditName] = useState("");
  const [subDeleteModalOpen, setSubDeleteModalOpen] = useState<null | number>(null);
  const [subActionBusy, setSubActionBusy] = useState(false);
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [randomCount, setRandomCount] = useState("4");
  const [randomCapacity, setRandomCapacity] = useState("1");
  const [randomBusy, setRandomBusy] = useState(false);

  const loadAll = useCallback(async () => {
    if (!Number.isFinite(parsedMainId) || parsedMainId <= 0) {
      setError("Invalid group.");
      setMainGroup(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [header, groups, rosterRows] = await Promise.all([
        getFacultyClassHeaderById(resolvedClassId).catch(() => null),
        listFacultyCourseGroups(resolvedClassId),
        listFacultyRosterRows(resolvedClassId),
      ]);
      if (header) {
        setClassHeader(header);
      }
      setRoster(rosterRows);
      const found = groups.find((g) => g.id === parsedMainId) ?? null;
      setMainGroup(found);
      if (!found) {
        setError("This main group was not found. It may have been removed.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setMainGroup(null);
    } finally {
      setLoading(false);
    }
  }, [parsedMainId, resolvedClassId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const assignedStudentIds = useMemo(() => {
    if (!mainGroup) {
      return new Set<number>();
    }
    const ids = new Set<number>();
    for (const sub of mainGroup.subGroups) {
      for (const s of sub.students) {
        ids.add(s.id);
      }
    }
    return ids;
  }, [mainGroup]);

  const studentToSubGroupId = useMemo(() => {
    const map = new Map<number, number>();
    if (!mainGroup) return map;
    for (const sub of mainGroup.subGroups) {
      for (const s of sub.students) {
        map.set(s.id, sub.id);
      }
    }
    return map;
  }, [mainGroup]);

  const rosterActiveWithId = useMemo(
    () => roster.filter((r) => r.studentId != null && r.status === "active"),
    [roster],
  );

  const unassignedActiveStudents = useMemo(
    () => rosterActiveWithId.filter((row) => row.studentId != null && !assignedStudentIds.has(row.studentId)),
    [rosterActiveWithId, assignedStudentIds],
  );

  const filteredSidebarStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return rosterActiveWithId;
    }
    return rosterActiveWithId.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.studentId != null && String(r.studentId).includes(q)),
    );
  }, [rosterActiveWithId, search]);

  const stats = useMemo(() => {
    const total = rosterActiveWithId.length;
    const assigned = assignedStudentIds.size;
    const groupCount = mainGroup?.subGroups.length ?? 0;
    return { total, assigned, groupCount };
  }, [rosterActiveWithId.length, assignedStudentIds.size, mainGroup?.subGroups.length]);

  const handleDropOnSub = useCallback(
    async (subGroupId: number, studentId: number, fromSubGroupId?: number) => {
      if (!mainGroup) {
        return;
      }
      const sub = mainGroup.subGroups.find((s) => s.id === subGroupId);
      if (!sub) {
        return;
      }
      if (sub.students.some((s) => s.id === studentId)) {
        setBanner("That student is already in this subgroup.");
        return;
      }
      setBanner(null);
      setDroppingSubId(subGroupId);
      try {
        if (fromSubGroupId != null && fromSubGroupId !== subGroupId) {
          await removeStudentFromFacultySubGroup(resolvedClassId, mainGroup.id, fromSubGroupId, studentId);
        }
        await addStudentToFacultySubGroup(resolvedClassId, mainGroup.id, subGroupId, studentId);
        await loadAll();
      } catch (err) {
        setBanner(getErrorMessage(err));
      } finally {
        setDroppingSubId(null);
      }
    },
    [mainGroup, resolvedClassId, loadAll],
  );

  const handleRemoveStudentFromSub = useCallback(
    async (subGroupId: number, studentId: number) => {
      if (!mainGroup) return;
      setBanner(null);
      setDroppingSubId(subGroupId);
      try {
        await removeStudentFromFacultySubGroup(resolvedClassId, mainGroup.id, subGroupId, studentId);
        await loadAll();
      } catch (err) {
        setBanner(getErrorMessage(err));
      } finally {
        setDroppingSubId(null);
      }
    },
    [mainGroup, resolvedClassId, loadAll],
  );

  const sidebarStudentRows = useMemo(() => {
    return filteredSidebarStudents.map((row) => ({
      key: String(row.id),
      studentId: row.studentId!,
      name: row.name,
      email: row.email,
    }));
  }, [filteredSidebarStudents]);

  const handleOpenMainEdit = () => {
    if (!mainGroup) return;
    setMainEditName(mainGroup.name);
    setMainEditModalOpen(true);
  };

  const handleOpenSubEdit = (sub: SubGroupResponse) => {
    setSubEditName(sub.name);
    setSubEditModalOpen(sub.id);
  };

  const handleRenameMain = useCallback(async () => {
    if (!mainGroup) return;
    const trimmed = mainEditName.trim();
    if (!trimmed) return;
    setMainActionBusy(true);
    setBanner(null);
    try {
      await updateFacultyMainGroupName(resolvedClassId, mainGroup.id, trimmed);
      setMainEditModalOpen(false);
      await loadAll();
    } catch (err) {
      setBanner(getErrorMessage(err));
    } finally {
      setMainActionBusy(false);
    }
  }, [mainEditName, mainGroup, resolvedClassId, loadAll]);

  const handleDeleteMain = useCallback(async () => {
    if (!mainGroup) return;
    setMainActionBusy(true);
    setBanner(null);
    try {
      await deleteFacultyMainGroup(resolvedClassId, mainGroup.id);
      navigate(`/faculty/class/${resolvedClassId}/groups`);
    } catch (err) {
      setBanner(getErrorMessage(err));
    } finally {
      setMainActionBusy(false);
    }
  }, [mainGroup, navigate, resolvedClassId]);

  const handleRenameSub = useCallback(async () => {
    if (!mainGroup || subEditModalOpen == null) return;
    const trimmed = subEditName.trim();
    if (!trimmed) return;
    setSubActionBusy(true);
    setBanner(null);
    try {
      await updateFacultySubGroupName(resolvedClassId, mainGroup.id, subEditModalOpen, trimmed);
      setSubEditModalOpen(null);
      await loadAll();
    } catch (err) {
      setBanner(getErrorMessage(err));
    } finally {
      setSubActionBusy(false);
    }
  }, [mainGroup, resolvedClassId, subEditModalOpen, subEditName, loadAll]);

  const handleDeleteSub = useCallback(async () => {
    if (!mainGroup || subDeleteModalOpen == null) return;
    setSubActionBusy(true);
    setBanner(null);
    try {
      await deleteFacultySubGroup(resolvedClassId, mainGroup.id, subDeleteModalOpen);
      setSubDeleteModalOpen(null);
      await loadAll();
    } catch (err) {
      setBanner(getErrorMessage(err));
    } finally {
      setSubActionBusy(false);
    }
  }, [mainGroup, resolvedClassId, subDeleteModalOpen, loadAll]);

  const handleCreateSub = async () => {
    if (!mainGroup) {
      return;
    }
    const trimmed = subName.trim();
    if (!trimmed) {
      return;
    }
    setActionBusy(true);
    setBanner(null);
    try {
      await createFacultySubGroup(resolvedClassId, mainGroup.id, trimmed);
      setSubName("");
      setSubModalOpen(false);
      await loadAll();
    } catch (err) {
      setBanner(getErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  };

  function buildRandomSubgroupNames(count: number): string[] {
    return Array.from({ length: count }, (_, index) => `Group ${index + 1}`);
  }

  const handleCreateRandomSubgroups = async () => {
    if (!mainGroup) {
      return;
    }

    const subgroupCount = Number(randomCount);
    const subgroupCapacity = Number(randomCapacity);
    if (!Number.isFinite(subgroupCount) || subgroupCount <= 0) {
      setBanner("Enter a valid number of subgroups.");
      return;
    }
    if (!Number.isFinite(subgroupCapacity) || subgroupCapacity <= 0) {
      setBanner("Enter a valid subgroup capacity.");
      return;
    }

    // Rebuild from scratch: all active students are re-randomized.
    const activeStudentIds = rosterActiveWithId
      .map((row) => row.studentId as number);
    if (activeStudentIds.length === 0) {
      setBanner("No active students available for random allocation.");
      return;
    }

    const names = buildRandomSubgroupNames(subgroupCount);
    const shuffled = [...activeStudentIds];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setRandomBusy(true);
    setBanner(null);
    try {
      // Replace previous randomization by clearing existing subgroups first.
      for (const existingSub of mainGroup.subGroups) {
        await deleteFacultySubGroup(resolvedClassId, mainGroup.id, existingSub.id);
      }

      const createdSubs: SubGroupResponse[] = [];
      for (const name of names) {
        const created = await createFacultySubGroup(resolvedClassId, mainGroup.id, name);
        createdSubs.push(created);
      }

      let assignedCount = 0;
      let cursor = 0;
      for (const sub of createdSubs) {
        for (let slot = 0; slot < subgroupCapacity && cursor < shuffled.length; slot += 1) {
          const studentId = shuffled[cursor];
          cursor += 1;
          await addStudentToFacultySubGroup(resolvedClassId, mainGroup.id, sub.id, studentId);
          assignedCount += 1;
        }
      }

      setRandomModalOpen(false);
      await loadAll();
      const leftUnassigned = activeStudentIds.length - assignedCount;
      setBanner(
        leftUnassigned > 0
          ? `Created ${createdSubs.length} subgroups and randomly assigned ${assignedCount} students. ${leftUnassigned} students remain unassigned due to capacity limits.`
          : `Created ${createdSubs.length} subgroups and randomly assigned ${assignedCount} students.`,
      );
    } catch (err) {
      setBanner(getErrorMessage(err));
    } finally {
      setRandomBusy(false);
    }
  };

  const courseTitle =
    classHeader?.code && classHeader?.name
      ? `${classHeader.code}: ${classHeader.name}`
      : classHeader?.name || classHeader?.code || "Class";

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-[#F5F2F2]">
        <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-200 px-4 py-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-[13px] text-gray-600 transition-colors hover:text-[#2B2A2A]"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                <NavItem
                  icon={<LayoutDashboard className="h-4 w-4" strokeWidth={2} />}
                  label="Dashboard"
                  active={false}
                  to={`/faculty/class/${resolvedClassId}/dashboard`}
                />
                <NavItem
                  icon={<FileText className="h-4 w-4" strokeWidth={2} />}
                  label="Assignments"
                  active={false}
                  to={`/faculty/class/${resolvedClassId}/assignments`}
                />
                <NavItem
                  icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />}
                  label="Grades"
                  active={false}
                  to={`/faculty/class/${resolvedClassId}/grades`}
                />
                <NavItem
                  icon={<Users className="h-4 w-4" strokeWidth={2} />}
                  label="Students"
                  active={false}
                  to={`/faculty/class/${resolvedClassId}/students`}
                />
                <NavItem
                  icon={<UserPlus className="h-4 w-4" strokeWidth={2} />}
                  label="Grading Assistants"
                  active={false}
                  to={`/faculty/class/${resolvedClassId}/assistants`}
                />
                <NavItem
                  icon={<UsersRound className="h-4 w-4" strokeWidth={2} />}
                  label="Groups"
                  active
                  to={`/faculty/class/${resolvedClassId}/groups`}
                />
                <NavItem
                  icon={<Settings className="h-4 w-4" strokeWidth={2} />}
                  label="Settings"
                  active={false}
                  to={`/faculty/class/${resolvedClassId}/settings`}
                />
              </ul>
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-b border-gray-200 bg-white px-6 py-5 sm:px-8">
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold text-[#2B2A2A] sm:text-[24px]">{courseTitle}</h1>
              <p className="mt-1 text-[13px] text-gray-600">{classHeader?.semester}</p>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[13px]">
                    <Link
                      to={`/faculty/class/${resolvedClassId}/groups`}
                      className="font-medium text-[#5A7ACD] hover:text-[#4a6abd]"
                    >
                      Groups
                    </Link>
                    <span className="text-gray-300">/</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#2B2A2A]">{mainGroup?.name ?? "…"}</span>
                      {mainGroup ? (
                        <>
                          <button
                            type="button"
                            aria-label="Edit main group name"
                            onClick={handleOpenMainEdit}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-[#2B2A2A]"
                          >
                            <Edit className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete main group"
                            onClick={() => setMainDeleteModalOpen(true)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-[#C23A42]"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <h2 className="text-[18px] font-semibold text-[#2B2A2A]">Group manager</h2>
                  <p className="text-[13px] text-gray-600">
                    Drag students from the list and drop them into a subgroup.
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void loadAll()}
                      disabled={loading}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                    >
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSubName("");
                        setSubModalOpen(true);
                      }}
                      disabled={!mainGroup || loading}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#2B2A2A] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#3a3939] disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      New subgroup
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRandomCount("4");
                      const defaultCount = 4;
                      const defaultCapacity = Math.max(
                        1,
                        Math.ceil(rosterActiveWithId.length / defaultCount),
                      );
                      setRandomCapacity(String(defaultCapacity));
                      setRandomModalOpen(true);
                    }}
                    disabled={!mainGroup || loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#5A7ACD]/40 bg-[#5A7ACD]/10 px-3.5 py-2 text-[13px] font-medium text-[#2B2A2A] hover:bg-[#5A7ACD]/20 disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={2} />
                    Random subgroup creator
                  </button>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:justify-end">
                    <span className="text-[#2B2A2A]">{stats.total} students</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[#2B2A2A]">{stats.assigned} assigned</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[#2B2A2A]">
                      {stats.groupCount} subgroup{stats.groupCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>

              {banner ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                  {banner}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-[#F2C9CC] bg-[#FFF5F5] px-3 py-2 text-[13px] text-[#C23A42]">
                  {error}
                  <div className="mt-2">
                    <Link
                      to={`/faculty/class/${resolvedClassId}/groups`}
                      className="font-medium text-[#5A7ACD] hover:underline"
                    >
                      Back to main groups
                    </Link>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex flex-1 items-center justify-center text-[13px] text-gray-500">Loading…</div>
              ) : !mainGroup ? null : (
                <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
                  <StudentsSidebar
                    students={sidebarStudentRows}
                    search={search}
                    onSearchChange={setSearch}
                    getFromSubGroupId={(studentId) => studentToSubGroupId.get(studentId)}
                    onUnassignDrop={(fromSubGroupId, studentId) =>
                      void handleRemoveStudentFromSub(fromSubGroupId, studentId)
                    }
                  />

                  {/* Subgroup grid */}
                  <div className="min-h-0 flex-1 overflow-y-auto lg:max-h-[calc(100vh-220px)]">
                    {mainGroup.subGroups.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <p className="text-[14px] font-medium text-[#2B2A2A]">No subgroups yet</p>
                        <p className="mt-1 text-[13px] text-gray-600">
                          Create a subgroup, then drag students into it.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSubModalOpen(true)}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#5A7ACD] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#4a6abd]"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2} />
                          New subgroup
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {mainGroup.subGroups.map((sub, i) => (
                          <SubGroupCard
                            key={sub.id}
                            sub={sub}
                            accentIndex={i}
                            dropping={droppingSubId === sub.id}
                            onDropStudent={handleDropOnSub}
                            onRemoveStudent={handleRemoveStudentFromSub}
                            onEditSub={handleOpenSubEdit}
                            onDeleteSub={(subId) => setSubDeleteModalOpen(subId)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {mainEditModalOpen && mainGroup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Edit main group</h3>
              <p className="mt-1 text-[13px] text-gray-600">
                Main group names must be unique within this course.
              </p>
              <label className="mt-4 block text-[12px] font-medium text-gray-600" htmlFor="gf-edit-main-name">
                Name
              </label>
              <input
                id="gf-edit-main-name"
                value={mainEditName}
                onChange={(e) => setMainEditName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] outline-none ring-[#5A7ACD] focus:ring-2"
              />
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMainEditModalOpen(false)}
                  disabled={mainActionBusy}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRenameMain()}
                  disabled={mainActionBusy || !mainEditName.trim()}
                  className="flex-1 rounded-xl bg-[#2B2A2A] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#3a3939] disabled:opacity-60"
                >
                  {mainActionBusy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {mainDeleteModalOpen && mainGroup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Delete main group?</h3>
              <p className="mt-2 text-[13px] text-gray-600">
                This will delete all subgroups and memberships under “{mainGroup.name}”.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMainDeleteModalOpen(false)}
                  disabled={mainActionBusy}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteMain()}
                  disabled={mainActionBusy}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {mainActionBusy ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {subEditModalOpen != null && mainGroup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Edit subgroup</h3>
              <p className="mt-1 text-[13px] text-gray-600">
                Subgroup names must be unique within the main group.
              </p>
              <label className="mt-4 block text-[12px] font-medium text-gray-600" htmlFor="gf-edit-sub-name">
                Name
              </label>
              <input
                id="gf-edit-sub-name"
                value={subEditName}
                onChange={(e) => setSubEditName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] outline-none ring-[#5A7ACD] focus:ring-2"
              />
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSubEditModalOpen(null)}
                  disabled={subActionBusy}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRenameSub()}
                  disabled={subActionBusy || !subEditName.trim()}
                  className="flex-1 rounded-xl bg-[#2B2A2A] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#3a3939] disabled:opacity-60"
                >
                  {subActionBusy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {subDeleteModalOpen != null && mainGroup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Delete subgroup?</h3>
              <p className="mt-2 text-[13px] text-gray-600">
                This will remove the subgroup and all its memberships.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSubDeleteModalOpen(null)}
                  disabled={subActionBusy}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteSub()}
                  disabled={subActionBusy}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {subActionBusy ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {subModalOpen && mainGroup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">New subgroup</h3>
              <p className="mt-1 text-[13px] text-gray-600">
                Under <span className="font-medium text-[#2B2A2A]">{mainGroup.name}</span>.
              </p>
              <label className="mt-4 block text-[12px] font-medium text-gray-600" htmlFor="gf-detail-sub-name">
                Name
              </label>
              <input
                id="gf-detail-sub-name"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="e.g. Team Alpha"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] outline-none ring-[#5A7ACD] focus:ring-2"
              />
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => !actionBusy && setSubModalOpen(false)}
                  disabled={actionBusy}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateSub()}
                  disabled={actionBusy || !subName.trim()}
                  className="flex-1 rounded-xl bg-[#2B2A2A] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#3a3939] disabled:opacity-60"
                >
                  {actionBusy ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {randomModalOpen && mainGroup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Random subgroup creator</h3>
              <p className="mt-1 text-[13px] text-gray-600">
                Automatically creates subgroups under <span className="font-medium text-[#2B2A2A]">{mainGroup.name}</span> and randomly assigns unassigned active students.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-medium text-gray-600" htmlFor="gf-random-subgroup-count">
                    Number of subgroups
                  </label>
                  <input
                    id="gf-random-subgroup-count"
                    type="number"
                    min={1}
                    value={randomCount}
                    onChange={(e) => setRandomCount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] outline-none ring-[#5A7ACD] focus:ring-2"
                  />
                </div>
                <div>
                    <label className="block text-[12px] font-medium text-gray-600" htmlFor="gf-random-subgroup-capacity">
                    Capacity per subgroup
                  </label>
                  <input
                    id="gf-random-subgroup-capacity"
                    type="number"
                      min={1}
                      value={randomCapacity}
                      onChange={(e) => setRandomCapacity(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] outline-none ring-[#5A7ACD] focus:ring-2"
                  />
                </div>
              </div>
              <p className="mt-3 text-[12px] text-gray-500">
                Subgroups are named automatically as Group 1, Group 2, Group 3, ...
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => !randomBusy && setRandomModalOpen(false)}
                  disabled={randomBusy}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateRandomSubgroups()}
                  disabled={randomBusy}
                  className="flex-1 rounded-xl bg-[#2B2A2A] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#3a3939] disabled:opacity-60"
                >
                  {randomBusy ? "Creating…" : "Create & Assign"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DndProvider>
  );
}
