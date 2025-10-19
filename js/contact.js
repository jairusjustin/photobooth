const contactForm = document.getElementById("contactForm");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(contactForm);

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" }
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Message Sent!",
        text: "Thank you for reaching out. We’ll get back to you soon!",
        timer: 1500,
        showConfirmButton: false
      });
      contactForm.reset();
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong. Please try again later.",
        timer: 1500,
        showConfirmButton: true
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Network issue or invalid endpoint. Please check your connection.",
      timer: 1500,
      showConfirmButton: true
    });
    console.error("Contact form error:", error);
  }
});
