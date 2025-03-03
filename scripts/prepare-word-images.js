const fs = require('fs');
const path = require('path');

// Word image dictionary - add your image references here
const wordImages = {
  'A': ['apple', 'airplane', 'ant'],
  'B': ['ball', 'banana', 'butterfly'],
  'C': ['cat', 'car', 'cake'],
  // ... add more words for each letter
};

// Create directory if it doesn't exist
const imageDir = path.join(__dirname, '../assets/word-images');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Create a checklist file
let checklist = '# Word Images Checklist\n\n';
Object.entries(wordImages).forEach(([letter, words]) => {
  checklist += `\n## Letter ${letter}\n`;
  words.forEach(word => {
    const filename = `${word}.png`;
    checklist += `- [ ] ${filename}\n`;
  });
});

fs.writeFileSync(
  path.join(__dirname, '../assets/word-images/checklist.md'),
  checklist
);

console.log('Created checklist for word images');
console.log('Please add appropriate images to the assets/word-images directory');
