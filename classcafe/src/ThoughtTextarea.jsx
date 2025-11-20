"use client";

import styles from "./ThoughtTextarea.module.css";

export default function ThoughtTextarea({
  value,
  onChange,
  placeholder,
  rows = 6,
  ...rest
}) {
  return (
    <textarea
      className={styles.textarea}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      {...rest}
    />
  );
}

