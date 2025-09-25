<?php
// src/Controller/MainController.php
namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use App\Entity\User;

class MainController extends AbstractController
{
     
    #[Route('/', name: 'app_main')]
    public function main(): Response
    {
        return $this->getUser()->is_authenticated() ? $this->redirectToRoute('login') : $this->redirectToRoute('chat');
    }
}