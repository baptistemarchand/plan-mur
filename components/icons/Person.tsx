export const Person = ({ color, size }: { color: string; size: string }) => {
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
          d="M8.00444,2a2.18,2.18,0,0,1,2.18372,2.1821V5.27284c.64721,0,.37815.9309,0,1.45453a4.27536,4.27536,0,0,1-.33525.36378c-.09377.25171-.1949.504-.31012.74166l.20838,1.076h.437l2.74909,1.52741A2.14771,2.14771,0,0,1,14,12.2907V14H2V12.32745A2.16272,2.16272,0,0,1,3.06275,10.4583l2.758-1.54945h.437l.21083-1.06869c-.11645-.24008-.21819-.49485-.31257-.749a4.27536,4.27536,0,0,1-.33525-.36378c-.37815-.52363-.64721-1.45453,0-1.45453V4.1821A2.18,2.18,0,0,1,8.00444,2"
        >
        </path>
      </g>
    </svg>
  );
};
