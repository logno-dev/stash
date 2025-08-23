const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/BookmarkList.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Add the showNotesOnly state variable after the other search states
const updatedContent = content.replace(
  /\/\/ Search states\s+const \[searchQuery, setSearchQuery\] = useState\(''\);\s+const \[fuse, setFuse\] = useState<Fuse<Bookmark> \| null>\(null\);/,
  `// Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [fuse, setFuse] = useState<Fuse<Bookmark> | null>(null);
  const [showNotesOnly, setShowNotesOnly] = useState(false);`
);

fs.writeFileSync(filePath, updatedContent);
console.log('Added showNotesOnly state variable');