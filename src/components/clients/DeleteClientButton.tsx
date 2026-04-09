"use client";

import { useState } from "react";
import { deleteClient } from "@/app/actions";

export default function DeleteClientButton({ id }: { id: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently delete this client and ALL of their attached data? This cannot be undone.")) {
      setIsPending(true);
      try {
        await deleteClient(id);
      } catch (err) {
        console.warn(err);
      }
      window.location.reload();
    }
  };

  return (
    <button onClick={handleDelete} disabled={isPending} className="btn btn-danger" style={{ width: "100%" }}>
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
