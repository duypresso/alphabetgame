try {
  const fs = require('fs');
  const { createCanvas } = require('canvas');

  // Dictionary of words for each letter
  const wordsForLetter = {
    'A': ['Apple', 'Ant', 'Airplane'],
    'B': ['Ball', 'Bear', 'Balloon'],
    'C': ['Cat', 'Car', 'Cake'],
    'D': ['Dog', 'Duck', 'Door'],
    'E': ['Egg', 'Elephant', 'Eye'],
    'F': ['Fish', 'Frog', 'Fan'],
    'G': ['Goat', 'Ghost', 'Grape'],
    'H': ['Hat', 'Horse', 'House'],
    'I': ['Ice', 'Igloo', 'Insect'],
    'J': ['Jam', 'Juice', 'Jellyfish'],
    'K': ['Kite', 'King', 'Kangaroo'],
    'L': ['Lion', 'Leaf', 'Lemon'],
    'M': ['Moon', 'Mouse', 'Monkey'],
    'N': ['Nest', 'Night', 'Nose'],
    'O': ['Orange', 'Owl', 'Ocean'],
    'P': ['Pig', 'Pencil', 'Panda'],
    'Q': ['Queen', 'Quilt', 'Question'],
    'R': ['Rainbow', 'Robot', 'Rain'],
    'S': ['Sun', 'Star', 'Snake'],
    'T': ['Tree', 'Tiger', 'Train'],
    'U': ['Umbrella', 'Under', 'Up'],
    'V': ['Van', 'Violin', 'Vase'],
    'W': ['Water', 'Wolf', 'Window'],
    'X': ['X-ray', 'Box', 'Fox'],
    'Y': ['Yellow', 'Yoyo', 'Yarn'],
    'Z': ['Zebra', 'Zoo', 'Zipper']
  };

  function createWordImage(word, letter, index) {
    const canvas = createCanvas(400, 200);
    const ctx = canvas.getContext('2d');

    // White background with light blue gradient
    const gradient = ctx.createLinearGradient(0, 0, 400, 200);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f0f7ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 200);

    // Add letter in background
    ctx.font = 'bold 120px Comic Sans MS';
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 200, 100);

    // Draw word
    ctx.font = 'bold 48px Comic Sans MS';
    ctx.fillStyle = '#4A4A4A';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeText(word, 200, 100);
    ctx.fillText(word, 200, 100);

    // Add border
    ctx.strokeStyle = '#4A4A4A';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 380, 180);

    // Create directory if it doesn't exist
    const dir = 'assets/words';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save file
    const filename = `${dir}/${letter.toLowerCase()}_${index + 1}.png`;
    fs.writeFileSync(filename, canvas.toBuffer());
    console.log(`Created: ${filename}`);
  }

  // Generate images for each letter
  Object.entries(wordsForLetter).forEach(([letter, words]) => {
    words.forEach((word, index) => {
      createWordImage(word, letter, index);
    });
  });

  console.log('Word images generated successfully!');

} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\x1b[31mError: Missing required package "canvas"');
    console.log('\x1b[33mPlease install it by running:');
    console.log('\x1b[32mnpm install canvas --save-dev\x1b[0m');
  } else {
    console.error('Error:', error);
  }
}
