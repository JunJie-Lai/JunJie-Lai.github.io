import loadFrames from "./cacheBadApple.js";

const initializeAnimation = (framesData) => {
	const fps = 60;
	const frameDuration = 1000 / fps; // Duration of each frame in milliseconds
	const asciiWrapper = document.getElementById("ASCII-display");
	const asciiDisplay = document.getElementById("ASCII-video");
	const stats = document.getElementById("Stats");

	const adjustDisplaySize = () => {
		// Scale font size relative to wrapper width
		const fontSize = asciiWrapper.clientWidth / 60; // Adjust this value to fine-tune the size
		asciiDisplay.style.fontSize = `${fontSize}px`;
	};

	adjustDisplaySize();
	window.addEventListener("resize", adjustDisplaySize);

	let animationFrameID;
	let isAutoPaused = false;
	let isManualPaused = false;
	let frameIndex = 0;
	let startTime = performance.now();

	// Stats
	let frames = 0;
	let lastFPSUpdate = performance.now();
	let currentFPS = 0;

	const renderFrame = () => {
		if (isAutoPaused) return;

		const elapsedTime = performance.now() - startTime;
		frameIndex = Math.floor(elapsedTime / frameDuration);
		// Check if frameIndex is within bounds of framesData
		if (frameIndex >= framesData.length) {
			frameIndex = 0;
			startTime = performance.now();
		}
		asciiDisplay.textContent = framesData[frameIndex]; // Get the frame from the array

		// Stats
		const now = performance.now();
		frames++;
		if (now - lastFPSUpdate >= 1000) {
			currentFPS = frames;
			frames = 0;
			lastFPSUpdate = now;

			// performance.memory is deprecated
			const memory = performance.memory
				? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`
				: "N/A";
			const frameTime = (1000 / currentFPS).toFixed(2) + " ms/frame";
			stats.textContent = `FPS: ${currentFPS} | Memory: ${memory} | Frame: ${frameTime}`;
		}

		animationFrameID = requestAnimationFrame(renderFrame); // Continue animation loop
	};

	const playAnimation = () => {
		isAutoPaused = false;
		startTime = performance.now() - frameIndex * frameDuration;
		animationFrameID = requestAnimationFrame(renderFrame);
	};

	const pauseAnimation = () => {
		if (isAutoPaused) return;
		isAutoPaused = true;
		cancelAnimationFrame(animationFrameID);
	};

	asciiWrapper.addEventListener("click", () => {
		if (isAutoPaused) {
			isManualPaused = false;
			playAnimation();
			return;
		}
		isManualPaused = true;
		pauseAnimation();
	});

	document.addEventListener("visibilitychange", () => {
		if (isManualPaused) return;
		document.hidden ? pauseAnimation() : playAnimation();
	});

	window.addEventListener("blur", () => {
		if (!isManualPaused) pauseAnimation();
	});

	window.addEventListener("focus", () => {
		if (!isManualPaused) playAnimation();
	});

	playAnimation();
};

(async () => {
	const framesData = await loadFrames();
	initializeAnimation(framesData);
})();
