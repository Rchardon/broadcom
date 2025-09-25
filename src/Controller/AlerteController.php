<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use App\Entity\Alerte;

final class AlerteController extends AbstractController
{
    #[Route('/alerte/new', name: 'app_new_alerte')]
    public function newAlerte(Request $request)
    {
        // just set up a fresh $task object (remove the example data)
        $task = new Task();

        $form = $this->createForm(TaskType::class, $task);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $task = $form->getData();

            $alerte=new Alerte();

            return $this->redirectToRoute('task_success');
        }        
    }
}
