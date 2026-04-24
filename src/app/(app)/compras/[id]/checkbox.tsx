"use client";
import { useTransition } from "react";
import { toggleItem } from "../actions";

export default function ItemCheckbox({
  id,
  listId,
  checked,
}: {
  id: number;
  listId: number;
  checked: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <input
      type="checkbox"
      className="size-5 accent-primary"
      defaultChecked={checked}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          const fd = new FormData();
          fd.set("id", String(id));
          fd.set("listId", String(listId));
          fd.set("checked", e.currentTarget.checked ? "1" : "0");
          await toggleItem(fd);
        })
      }
    />
  );
}
