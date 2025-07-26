import logo from "../../assets/logo.png";

const Loader = () => {
  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <style>
        {`
          @keyframes jiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(3deg); }
            75% { transform: rotate(-3deg); }
          }
        `}
      </style>

      <img
        src={logo}
        alt="Loading..."
        className="w-24 h-24"
        style={{
          animation: "jiggle 0.6s ease-in-out infinite",
        }}
      />
    </div>
  );
};

export default Loader;
