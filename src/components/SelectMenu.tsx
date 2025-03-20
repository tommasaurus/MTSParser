"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { Listbox, Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

// Custom icon styling to override defaults
const iconStyles = {
  chevron: {
    width: "0.75rem", // 12px
    height: "0.75rem",
    "@media (minWidth: 640px)": {
      width: "1rem", // 16px
      height: "1rem",
    },
  },
  check: {
    width: "0.75rem", // 12px
    height: "0.75rem",
    "@media (minWidth: 640px)": {
      width: "1rem", // 16px
      height: "1rem",
    },
  },
  search: {
    width: "0.875rem", // 14px
    height: "0.875rem",
    "@media (minWidth: 640px)": {
      width: "1rem", // 16px
      height: "1rem",
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
  onChange: (value: Option) => void;
  optional?: boolean;
  placeholder?: string;
}

export function SelectMenu({
  label,
  options,
  value,
  onChange,
  optional = false,
  placeholder = "Select an option",
}: SelectMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) =>
        option.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchQuery, options]);

  // Clear search when dropdown closes
  const handleMenuClose = () => {
    setSearchQuery("");
  };

  // Auto focus the search input when dropdown opens
  const handleMenuOpen = (open: boolean) => {
    if (open) {
      // Use setTimeout to ensure the dropdown is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    } else {
      handleMenuClose();
    }
  };

  return (
    <div className="w-full">
      <Listbox
        value={value}
        onChange={(newValue) => {
          if (newValue) {
            onChange(newValue);
            setSearchQuery("");
          }
        }}
        as="div"
      >
        {({ open }) => {
          useEffect(() => {
            handleMenuOpen(open);
          }, [open]);

          return (
            <div className="relative">
              <Listbox.Label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                {label}{" "}
                {optional && (
                  <span className="text-slate-400 font-normal italic ml-1">
                    (Optional)
                  </span>
                )}
              </Listbox.Label>
              <Listbox.Button
                className={`relative w-full cursor-pointer rounded-xl border ${
                  open
                    ? "border-blue-500/50 bg-slate-800/90 ring-2 ring-blue-500/20"
                    : "border-slate-700 bg-slate-800/70 hover:bg-slate-800"
                } py-3 sm:py-3.5 pl-4 sm:pl-5 pr-10 text-left focus:outline-none transition-all duration-200 backdrop-blur-sm text-sm`}
              >
                <span
                  className={`block truncate ${
                    !value ? "text-slate-500" : "text-slate-200"
                  }`}
                >
                  {value ? value.name : placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
                  <ChevronDownIcon
                    style={iconStyles.chevron}
                    className={`text-slate-400 transition-transform duration-200 ${
                      open ? "transform rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-2"
                afterLeave={() => setSearchQuery("")}
              >
                <Listbox.Options className="fixed z-50 mt-1.5 max-h-96 w-full overflow-auto rounded-xl bg-slate-800/90 backdrop-blur-sm py-1.5 shadow-xl ring-1 ring-black ring-opacity-10 focus:outline-none text-sm border border-slate-700/60">
                  {/* Search input */}
                  <div className="sticky top-0 px-3 py-2 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/40">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MagnifyingGlassIcon
                          style={iconStyles.search}
                          className="text-slate-400"
                        />
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        className="w-full py-2 pl-9 pr-3 text-sm bg-slate-900/60 border border-slate-700/60 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          // Prevent Listbox from closing when pressing Enter in the search field
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (filteredOptions.length > 0) {
                              onChange(filteredOptions[0]);
                              setSearchQuery("");
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Display message when no results */}
                  {filteredOptions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-slate-400 text-center">
                      No options found
                    </div>
                  )}

                  {/* Options list */}
                  {filteredOptions.map((option) => (
                    <Listbox.Option
                      key={option.id}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors duration-150 ${
                          active
                            ? "bg-blue-600/20 text-white"
                            : "text-slate-300 hover:text-slate-200"
                        }`
                      }
                      value={option}
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={`block truncate transition-colors duration-150 ${
                              selected
                                ? "font-medium text-white"
                                : "font-normal"
                            }`}
                          >
                            {option.name}
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? "text-blue-300" : "text-blue-400"
                              }`}
                            >
                              <CheckIcon
                                style={iconStyles.check}
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          );
        }}
      </Listbox>
    </div>
  );
}
