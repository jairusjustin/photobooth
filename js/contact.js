const contactForm = document.getElementById("contactForm");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(contactForm);

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if(result.success){
      Swal.fire({
        icon: "success",
        title: "Message Sent!",
        text: result.message,
        timer: 1000,
        showConfirmButton: false
      });
      contactForm.reset();
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: result.message,
        timer: 1500,
        showConfirmButton: true
      });
    }

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Something went wrong. Please try again later.",
      timer: 1500,
      showConfirmButton: true
    });
    console.error("Contact form error:", error);
  }
});
