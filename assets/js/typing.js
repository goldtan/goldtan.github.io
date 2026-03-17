(function () {
  var el = document.getElementById("typing-subtitle");
  if (!el) return;

  var words = ["Graph Neural Networks", "Retrieval-Augmented Generation", "Recommender Systems", "Knowledge Graphs"];
  var wordIndex = 0;
  var charIndex = 0;
  var isDeleting = false;
  var pauseEnd = 0;

  function tick() {
    var current = words[wordIndex];
    var speed;

    if (Date.now() < pauseEnd) {
      requestAnimationFrame(tick);
      return;
    }

    if (!isDeleting) {
      charIndex++;
      el.textContent = current.substring(0, charIndex);
      speed = 60 + Math.random() * 40;

      if (charIndex === current.length) {
        isDeleting = true;
        pauseEnd = Date.now() + 2000;
      }
    } else {
      charIndex--;
      el.textContent = current.substring(0, charIndex);
      speed = 30;

      if (charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }
    }

    setTimeout(function () {
      requestAnimationFrame(tick);
    }, speed);
  }

  tick();
})();
