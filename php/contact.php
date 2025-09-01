<?php
require '../vendor/autoload.php'; // adjust if path is different

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

header('Content-Type: application/json');

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);

    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['EMAIL_USER']; // your Gmail
        $mail->Password   = $_ENV['EMAIL_PASS']; // app password
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        // Recipients
        $mail->setFrom($_ENV['EMAIL_USER'], 'Photobooth Contact Form'); 
        $mail->addAddress($_ENV['EMAIL_TO']); 

        // Content
        $mail->isHTML(true);
        $mail->Subject = "Contact Form: $name";
        $mail->Body    = "<p><strong>Name:</strong> $name</p>
                          <p><strong>Email:</strong> $email</p>
                          <p><strong>Message:</strong><br>$message</p>";

        $mail->send();

        echo json_encode(['success' => true, 'message' => 'Your message has been sent!']);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Mailer Error: '.$mail->ErrorInfo]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
}
?>
