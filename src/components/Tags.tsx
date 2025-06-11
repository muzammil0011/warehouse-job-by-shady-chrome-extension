import { PlusOutlined } from "@ant-design/icons";
import type { InputRef } from "antd";
import { Button, Input, Tag, theme, Tooltip } from "antd";
import React, { useEffect, useRef, useState } from "react";

const tagInputStyle: React.CSSProperties = {
  width: 120,
  height: 22,
  marginInlineEnd: 8,
  verticalAlign: "top",
};

const suggestionListStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "100%",
  left: 0,
  right: 0,
  background: "white",
  border: "1px solid #d9d9d9",
  borderRadius: "6px",
  maxHeight: "200px",
  overflowY: "auto",
  zIndex: 1000,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
};

const suggestionItemStyle: React.CSSProperties = {
  padding: "8px 12px",
  cursor: "pointer",
  borderBottom: "1px solid #f0f0f0",
};

const suggestionItemHoverStyle: React.CSSProperties = {
  ...suggestionItemStyle,
  backgroundColor: "#f5f5f5",
};

interface TagsProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  allowedCities?: string[];
}

const Tags: React.FC<TagsProps> = ({
  value = [],
  onChange,
  allowedCities = [],
}) => {
  const { token } = theme.useToken();
  const [tags, setTags] = useState<string[]>(value);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editInputIndex, setEditInputIndex] = useState(-1);
  const [editInputValue, setEditInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<InputRef>(null);
  const editInputRef = useRef<InputRef>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputVisible) inputRef.current?.focus();
  }, [inputVisible]);

  useEffect(() => {
    if (editInputIndex !== -1) editInputRef.current?.focus();
  }, [editInputValue]);

  useEffect(() => {
    if (value) setTags(value);
  }, [value]);

  // Filter suggestions based on input value
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = allowedCities.filter(
        (city) =>
          city.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.includes(city),
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [inputValue, allowedCities, tags]);

  const updateTags = (newTags: string[]) => {
    setTags(newTags);
    onChange?.(newTags);
  };

  const handleClose = (removedTag: string) => {
    const newTags = tags.filter((tag) => tag !== removedTag);
    updateTags(newTags);
  };

  const showInput = () => setInputVisible(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = (selectedCity?: string) => {
    const cityToAdd = selectedCity || inputValue;
    if (cityToAdd && !tags.includes(cityToAdd)) {
      // Only add if it's in allowed cities or if no cities restriction
      if (allowedCities.length === 0 || allowedCities.includes(cityToAdd)) {
        updateTags([...tags, cityToAdd]);
      }
    }
    setInputVisible(false);
    setInputValue("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleInputConfirm(suggestions[selectedSuggestionIndex]);
        } else {
          handleInputConfirm();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (city: string) => {
    handleInputConfirm(city);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditInputValue(e.target.value);
  };

  const handleEditInputConfirm = () => {
    const newTags = [...tags];
    newTags[editInputIndex] = editInputValue;
    updateTags(newTags);
    setEditInputIndex(-1);
    setEditInputValue("");
  };

  const handleAddAllCities = () => {
    const availableCities = allowedCities.filter(
      (city) => !tags.includes(city),
    );
    updateTags([...tags, ...availableCities]);
  };

  const handleRemoveAllCities = () => {
    updateTags([]);
  };
  const handleResetCities = () => {
    updateTags([
      "Bolton",
      "Brampton",
      "Burnaby",
      "Cambridge",
      "Concord",
      "Toronto",
      "Sidney",
    ]);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="btn flex justify-between gap-1 mb-2 border p-2 border-gray-300 bg-gray-100 rounded-md w-full">
        {allowedCities.length > 0 && (
          <Button
            size="small"
            className="bg-green-500 text-white rounded-md disabled:bg-gray-400"
            onClick={handleAddAllCities}
            disabled={allowedCities.every((city) => tags.includes(city))}
          >
            Add All
            {/* (
            {allowedCities.filter((city) => !tags.includes(city)).length}{" "}
            remaining) */}
          </Button>
        )}
        <Button
          size="small"
          type="primary"
          danger
          onClick={handleRemoveAllCities}
          disabled={tags.length <= 0}
          className="rounded-md"
        >
          Remove All
        </Button>
        <Button
          size="small"
          type="primary"
          danger
          onClick={handleResetCities}
          className="rounded-md bg-yellow-300 text-slate-700"
        >
          Reset
        </Button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {tags.map<React.ReactNode>((tag, index) => {
          if (editInputIndex === index) {
            return (
              <Input
                ref={editInputRef}
                key={tag}
                size="small"
                style={tagInputStyle}
                value={editInputValue}
                onChange={handleEditInputChange}
                onBlur={handleEditInputConfirm}
                onPressEnter={handleEditInputConfirm}
              />
            );
          }

          const isLongTag = tag.length > 20;
          const tagElem = (
            <Tag
              key={tag}
              closable
              className="select-none m-0"
              onClose={() => handleClose(tag)}
            >
              <span
                onDoubleClick={(e) => {
                  if (index !== 0) {
                    setEditInputIndex(index);
                    setEditInputValue(tag);
                    e.preventDefault();
                  }
                }}
              >
                {isLongTag ? `${tag.slice(0, 20)}...` : tag}
              </span>
            </Tag>
          );

          return isLongTag ? (
            <Tooltip title={tag} key={tag}>
              {tagElem}
            </Tooltip>
          ) : (
            tagElem
          );
        })}

        {inputVisible ? (
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              size="small"
              style={tagInputStyle}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={(e) => {
                // Delay blur to allow suggestion clicks
                setTimeout(() => {
                  if (
                    !suggestionContainerRef.current?.contains(
                      e.relatedTarget as Node,
                    )
                  ) {
                    handleInputConfirm();
                  }
                }, 150);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type to search..."
            />
            {showSuggestions && (
              <div ref={suggestionContainerRef} style={suggestionListStyle}>
                {suggestions.map((city, index) => (
                  <div
                    key={city}
                    style={
                      selectedSuggestionIndex === index
                        ? suggestionItemHoverStyle
                        : suggestionItemStyle
                    }
                    onClick={() => handleSuggestionClick(city)}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tag
            className="bg-black text-white border-dashed shadow"
            icon={<PlusOutlined />}
            onClick={showInput}
          >
            New Tag
          </Tag>
        )}
      </div>
    </div>
  );
};

export default Tags;
