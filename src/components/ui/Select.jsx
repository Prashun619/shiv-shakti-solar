export default function Select({

  label,

  children,

  className = "",

  ...props

}) {

  return (

    <div className="space-y-2">

      {label && (

        <label className="text-sm font-medium text-slate-700">

          {label}

        </label>

      )}

      <select

        {...props}

        className={`
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          px-4
          py-3
          transition
          duration-300
          outline-none
          focus:ring-4
          focus:ring-indigo-100
          focus:border-indigo-500
          ${className}
        `}
      >

        {children}

      </select>

    </div>

  );

}