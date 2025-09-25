<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use App\Form\AlerteType;
use App\Entity\Alerte;

final class AlerteController extends AbstractController
{
    #[Route('/alertes', name: 'app_alertes')]
    public function index(Request $request, ManagerRegistry $doctrine, EntityManagerInterface $entityManager): Response
    {
        $user = $this->getUser();
        if(in_array('ROLE_ADMIN', $user->getRoles())){
            return $this->redirectToRoute('admin');
        }

        $alertes = $doctrine->getRepository(Alerte::class)->findAll();
        $alerte=new Alerte();
        $form = $this->createForm(AlerteType::class, $alerte);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            // $form->getData() holds the submitted values// but, the original `$task` variable has also been updated$task = $form->getData();
            
            $alerte = $form->getData();
            $entityManager->persist($alerte);
            $entityManager->flush();
        }

        return $this->render('alertes.html.twig', [
            'alertes' => $alertes,
            'form' => $form,
        ]);
    }
}
