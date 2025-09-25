<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Security;
use App\Form\AlerteType;
use App\Form\ChatType;
use App\Entity\Alerte;
use App\Entity\Conversation;
use App\Entity\Message;

final class ChatController extends AbstractController
{
    #[Route('/chat', name: 'app_chat')]
    public function index(ManagerRegistry $doctrine, EntityManagerInterface $entityManager): Response
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

        $form = $this->createForm(ChatType::class, null);

        return $this->render('chat-unified.html.twig', [
            'current_user' => $user,
            'conversations' => $conversations,
            'form' => $form,
        ]);
    }

    #[Route('/chat/{id}', name: 'app_conv_chat')]
    public function convChat(Request $request, EntityManagerInterface $entityManager, Conversation $idConv) {
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

        $vraiConvs = []; 
        foreach($conversations as $conv) {
            if ($conv->getId() == $idConv->getId()) {
                array_push($vraiConvs, $conv);
            }
        }

        $message=new Message();
        $form = $this->createForm(ChatType::class, $message);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            // $form->getData() holds the submitted values// but, the original `$task` variable has also been updated$task = $form->getData();
            
            $message = $form->getData();
            $entityManager->persist($message);
            $entityManager->flush();
        }

        return $this->render('chat-unified.html.twig', [
            'current_user' => $user,
            'conversations' => $vraiConvs,
            'conversation' => $idConv,
            'form' => $form,
        ]);
    }
}
