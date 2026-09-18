import { TextureLoader } from './three.modules';

// Texture loading functions
// Function called when download progresses
var onProgress = function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
};
// Function called when download errors
var onError = function (xhr) {
    console.log('An error happened');
};
// Load up texture
export default function loadTexture(file, done) {
    var loader = new TextureLoader();
    loader.load(file, done, onProgress, onError);
};