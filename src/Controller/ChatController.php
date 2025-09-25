<?php

namespace App\Controller;

use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Security;
use App\Entity\Alerte;

final class ChatController extends AbstractController
{
    #[Route('/chat', name: 'app_chat')]
    public function index(ManagerRegistry $doctrine): Response
    {
        $user = $this->getUser();
        if(in_array('ROLE_ADMIN', $user->getRoles())){
            return $this->redirectToRoute('admin');
        }

        $conversations1=$user->getConversations1();
        $conversations2=$user->getConversations2();
        $conversations=[];
        foreach($conversations1 as $conversation) {
            array_push($conversations, $conversation);
        }
        foreach($conversations2 as $conversation) {
            array_push($conversations, $conversation);
        }

        $alertes = $doctrine->getRepository(Alerte::class)->findAll();

        return $this->render('chat-unified.html.twig', [
            'controller_name' => 'ChatController',
            'current_user' => $user,
            'conversations' => $conversations,
            'alertes' => $alertes,
        ]);
    }

    #[Route('/chat/new', name: 'app_new_chat')]
    public function newChat(Request $request) {

    }
}
