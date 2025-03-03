import { Word } from '../types/Word';

const API_BASE_URL = 'http://localhost:8080/api';

export class WordService {
    static async getWordByLetter(letter: string): Promise<Word> {
        try {
            console.log(`Fetching word for letter: ${letter}`);
            const response = await fetch(`${API_BASE_URL}/words/${letter}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received data from backend:', data);

            return {
                _id: data._id || '',
                letter: data.letter,
                word: data.word,
                imageUrl: data.imageUrl
            };
        } catch (error) {
            console.error('Error in getWordByLetter:', error);
            throw error;
        }
    }

    static async preloadImage(scene: Phaser.Scene, word: Word): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log('Preloading image:', word.imageUrl);
            const key = `word-image-${word.letter}`;
            
            if (scene.textures.exists(key)) {
                console.log('Image already loaded:', key);
                resolve();
            } else {
                scene.load.image(key, word.imageUrl);
                scene.load.once('complete', () => {
                    console.log('Image loaded successfully:', key);
                    resolve();
                });
                scene.load.once('loaderror', (fileObj: any) => {
                    console.error('Failed to load image:', fileObj.src);
                    reject(new Error(`Failed to load image: ${fileObj.src}`));
                });
                scene.load.start();
            }
        });
    }
}
