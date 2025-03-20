"use client";

import { Fragment, useState, useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";

// Custom icon styling to override defaults
const iconStyles = {
  chevron: {
    width: "1rem", // 16px
    height: "1rem",
    "@media (minWidth: 640px)": {
      width: "1.25rem", // 20px
      height: "1.25rem",
    },
  },
  check: {
    width: "1rem", // 16px
    height: "1rem",
    "@media (minWidth: 640px)": {
      width: "1.25rem", // 20px
      height: "1.25rem",
    },
  },
};

interface Option {
  id: string;
  name: string;
}

interface SelectMenuProps {
  label: string;
  options: Option[];
  value: Option | null;
  onChange: (selected: Option | null) => void;
  optional?: boolean;
  placeholder?: string;
}

export function SelectMenu({
  label,
  options,
  value,
  onChange,
  optional = false,
  placeholder = "Select an option...",
}: SelectMenuProps) {
  // Ensure we have a valid value when options change
  useEffect(() => {
    // If we have a value but it's not in the options anymore, reset it
    if (value && !options.find((option) => option.id === value.id)) {
      onChange(null);
    }
  }, [options, value, onChange]);

  return (
    <div>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <div className="contents">
            <Listbox.Label className="block text-sm font-medium text-slate-300 mb-2">
              {label}
              {!optional && (
                <span className="text-red-400 ml-1" aria-hidden="true">
                  *
                </span>
              )}
            </Listbox.Label>
            <div className="relative">
              <Listbox.Button
                className={`relative w-full bg-slate-800 border ${
                  open
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-slate-600 hover:border-slate-500"
                } rounded-xl py-3 pl-4 pr-10 text-left shadow-md focus:outline-none transition-all duration-200 cursor-pointer ${
                  !value ? "text-slate-400" : "text-white"
                }`}
              >
                <span className="block truncate">
                  {value ? value.name : placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronUpDownIcon
                    style={iconStyles.chevron}
                    className="text-slate-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                show={open}
                as="div"
                className="contents"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-slate-800 py-1 text-base shadow-lg ring-1 ring-slate-700 focus:outline-none sm:text-sm scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                  {optional && (
                    <Listbox.Option
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active ? "bg-slate-700 text-white" : "text-slate-300"
                        }`
                      }
                      value={null}
                    >
                      {({ selected, active }) => (
                        <div className="contents">
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            None
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400`}
                            >
                              <CheckIcon
                                style={iconStyles.check}
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </div>
                      )}
                    </Listbox.Option>
                  )}
                  {options.map((option) => (
                    <Listbox.Option
                      key={option.id}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active ? "bg-slate-700 text-white" : "text-slate-300"
                        }`
                      }
                      value={option}
                    >
                      {({ selected, active }) => (
                        <div className="contents">
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {option.name}
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400`}
                            >
                              <CheckIcon
                                style={iconStyles.check}
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </div>
        )}
      </Listbox>
    </div>
  );
}
