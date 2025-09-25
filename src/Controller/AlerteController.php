<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class AlerteController extends AbstractController
{
    #[Route('/alerte/new', name: 'app_new_alerte')]
    public function newAlerte()
    {
        
    }
}
