import React from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { generateAvatarFallback } from "../utils/mockData";

const ContactItem = ({ contact, isSelected, onSelect, effectiveTheme }) => {
  return (
  <motion.div
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    whileHover={{
      scale: 1.02,
      transition: { duration: 0.2, ease: "easeInOut" },
    }}
    whileTap={{ scale: 0.98 }}
    className={`flex items-center p-3 cursor-pointer transition-all duration-300 ${
      isSelected
        ? effectiveTheme.accent + " text-white shadow-lg"
        : effectiveTheme.hover
    }`}
    onClick={() => onSelect(contact)}
  >
    <motion.div
      className="relative"
      whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
    >
      {contact.isDocument ? (
        <motion.div
          className={`w-12 h-12 rounded-full ${effectiveTheme.accent} flex items-center justify-center`}
          whileHover={{ rotateY: 180, transition: { duration: 0.6 } }}
        >
          <FileText className="w-6 h-6 text-white" />
        </motion.div>
      ) : contact.avatar ? (
        <motion.img
          src={contact.avatar}
          alt={contact.name}
          className="w-12 h-12 rounded-full object-cover"
          whileHover={{ scale: 1.1, transition: { duration: 0.3 } }}
        />
      ) : (
        <motion.div
          className={`w-12 h-12 rounded-full ${effectiveTheme.accent} flex items-center justify-center text-white font-semibold`}
          whileHover={{
            scale: 1.1,
            rotateY: 180,
            transition: { duration: 0.4 },
          }}
        >
          {generateAvatarFallback(contact.name)}
        </motion.div>
      )}

      {contact.isOnline && !contact.isDocument && (
        <motion.div
          className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>

    <div className="ml-3 flex-1 min-w-0">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h3
          className={`font-semibold truncate ${
            isSelected
              ? "text-white"
              : effectiveTheme.text
          }`}
        >
          {contact.name}
        </h3>
        <motion.span
          className={`text-xs ${
            isSelected
              ? "text-blue-100"
              : effectiveTheme.textSecondary
          }`}
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {contact.timestamp}
        </motion.span>
      </motion.div>

      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <p
          className={`text-sm truncate ${
            contact.isTyping
              ? "text-green-500 italic"
              : isSelected
              ? "text-blue-100"
              : effectiveTheme.textSecondary
          }`}
        >
          {contact.isTyping ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              typing...
            </motion.span>
          ) : (
            contact.lastMessage
          )}
        </p>

        {contact.unreadCount > 0 && (
          <motion.span
            className={`${effectiveTheme.accent} text-white text-xs rounded-full px-2 py-1 ml-2 min-w-[1.25rem] text-center`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
            }}
          >
            {contact.unreadCount}
          </motion.span>
        )}
      </motion.div>
    </div>
  </motion.div>
  );
};

ContactItem.displayName = 'ContactItem';

export default ContactItem;