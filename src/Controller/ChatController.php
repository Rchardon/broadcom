<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Security;

final class ChatController extends AbstractController
{
    #[Route('/chat', name: 'app_chat')]
    public function index(): Response
    {
        $user = $this->getUser();
        if(in_array('ROLE_ADMIN', $user->getRoles())){
            return $this->redirectToRoute('admin');
        }

        return $this->render('chat-unified.html.twig', [
            'controller_name' => 'ChatController',
        ]);
    }
}
