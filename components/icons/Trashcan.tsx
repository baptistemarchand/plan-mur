export const Trashcan = ({ color, size }: { color: string; size: string }) => {
  return (
    <svg
      fill={color}
      height={size}
      width={size}
      id="Layer_1"
      data-name="Layer 1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
    >
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
      </g>
      <g id="SVGRepo_iconCarrier">
        <path
          class="cls-1"
          d="M9.99951,4V2h-4V4h-3V6h1v8H12V6h1V4ZM7,13H6V6H7ZM8.99951,4h-2V3h2ZM10,13H9V6h1Z"
        >
        </path>
      </g>
    </svg>
  );
};
