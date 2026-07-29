"use client";

export function ConfirmDeleteButton({
  message = "정말 삭제하시겠습니까?",
  label = "삭제",
}: {
  message?: string;
  label?: string;
}) {
  return (
    <button
      type="submit"
      className="admin-link-button"
      onClick={(event) => {
        if (!confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
