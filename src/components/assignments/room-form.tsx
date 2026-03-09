"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlignLeft, BedDouble, Hash } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  description: z.string().optional(),
});

type RoomFormInput = z.input<typeof roomSchema>;
type RoomFormValues = z.output<typeof roomSchema>;

interface RoomFormProps {
  initialData?: Partial<RoomFormInput>;
  onSubmit: (data: RoomFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoomForm({ initialData, onSubmit, onCancel, isLoading }: RoomFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormInput, any, RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: initialData ?? { capacity: 1 },
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary-500" />
          Room Name
        </label>
        <input
          {...register("name")}
          placeholder="e.g. Room 220, Operating Room A"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.name && <p className="text-xs text-danger-600 font-medium">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <BedDouble className="w-4 h-4 text-primary-500" />
          Capacity
        </label>
        <input
          {...register("capacity")}
          type="number"
          min={1}
          placeholder="1"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        {errors.capacity && <p className="text-xs text-danger-600 font-medium">{errors.capacity.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-primary-500" />
          Description (optional)
        </label>
        <textarea
          {...register("description")}
          placeholder="Brief description of this room..."
          rows={3}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          {isLoading ? "Saving..." : isEditing ? "Update Room" : "Add Room"}
        </button>
      </div>
    </form>
  );
}
