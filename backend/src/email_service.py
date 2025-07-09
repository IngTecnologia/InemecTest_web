"""
Servicio de correo electrónico para envío de reportes de evaluación
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from pathlib import Path
import os
from typing import Dict, Any, Tuple

class EmailService:
    def __init__(self):
        # Configuración SMTP para Outlook
        self.smtp_server = "smtp.office365.com"
        self.smtp_port = 587
        
        # ⚠️ HARDCODEAR AQUÍ TUS CREDENCIALES
        self.sender_email = "TU_CORREO@outlook.com"  # 👈 Cambiar por tu correo
        self.sender_password = "TU_CONTRASEÑA"        # 👈 Cambiar por tu contraseña
        self.sender_name = "InemecTest - Sistema de Evaluaciones"
        
        # Configuración de mensajes (hardcodeados para fácil modificación)
        self.email_subject = "Reporte de Evaluación - InemecTest"
        self.email_intro = "Estimado(a) evaluado(a),\n\nAdjunto encontrará el reporte completo de su evaluación presentada en el sistema DICACOCU 360°."
        self.email_footer = "Este es un correo automático, por favor no responda.\n\nSaludos,\nEquipo de Nuevas Tecnologías INEMEC"
    
    def send_evaluation_report(self, evaluation_data: Dict[str, Any], recipient_email: str) -> Tuple[bool, str]:
        """
        Enviar reporte de evaluación por correo electrónico
        
        Args:
            evaluation_data: Datos de la evaluación
            recipient_email: Correo del destinatario
            
        Returns:
            Tuple[bool, str]: (éxito, mensaje)
        """
        try:
            # Crear mensaje
            msg = MIMEMultipart('related')
            msg['Subject'] = self.email_subject
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = recipient_email
            
            # Generar contenido HTML
            html_content = self._generate_html_report(evaluation_data)
            
            # Adjuntar HTML
            msg.attach(MIMEText(html_content, 'html'))
            
            # Adjuntar logo si existe
            logo_path = Path(__file__).parent.parent.parent / "Logo-Inemec.jpg"
            print(f"🔍 Buscando logo en: {logo_path}")
            print(f"🔍 Logo existe: {logo_path.exists()}")
            
            if logo_path.exists():
                with open(logo_path, 'rb') as f:
                    img_data = f.read()
                    img = MIMEImage(img_data)
                    img.add_header('Content-ID', '<logo>')
                    img.add_header('Content-Disposition', 'inline', filename='logo.jpg')
                    msg.attach(img)
                    print("✅ Logo adjuntado exitosamente")
            else:
                print("❌ Logo no encontrado")
            
            # Enviar correo
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()  # Activar encriptación TLS
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
                
            return True, "Correo enviado exitosamente"
            
        except smtplib.SMTPAuthenticationError:
            return False, "Error de autenticación. Verifique las credenciales del correo."
        except smtplib.SMTPException as e:
            return False, f"Error SMTP: {str(e)}"
        except Exception as e:
            return False, f"Error enviando correo: {str(e)}"
    
    def _generate_html_report(self, evaluation_data: Dict[str, Any]) -> str:
        """
        Generar reporte HTML con el mismo diseño que la pantalla de resultados
        
        Args:
            evaluation_data: Datos de la evaluación
            
        Returns:
            str: Contenido HTML del reporte
        """
        
        # Extraer datos de la evaluación
        user_name = evaluation_data.get('nombre', 'N/A')
        user_cedula = evaluation_data.get('cedula', 'N/A')
        procedure_codigo = evaluation_data.get('procedure_codigo', 'N/A')
        procedure_nombre = evaluation_data.get('procedure_nombre', 'N/A')
        score_percentage = evaluation_data.get('score_percentage', 0)
        correct_answers = evaluation_data.get('correct_answers', 0)
        total_questions = evaluation_data.get('total_questions', 0)
        aprobo_conocimiento = evaluation_data.get('aprobo_conocimiento', 'No')
        aprobo_aplicado = evaluation_data.get('aprobo', 'No')
        evaluation_id = evaluation_data.get('evaluation_id', 'N/A')
        
        # Determinar clases CSS y textos según aprobación
        conocimiento_class = 'approved' if aprobo_conocimiento == 'Sí' else 'failed'
        conocimiento_status = '✅ APROBÓ' if aprobo_conocimiento == 'Sí' else '❌ NO APROBÓ'
        conocimiento_detail = '≥80% requerido' if aprobo_conocimiento == 'Sí' else '<80% obtenido'
        
        aplicado_class = 'approved' if aprobo_aplicado == 'Sí' else 'failed'
        aplicado_status = '✅ APROBÓ' if aprobo_aplicado == 'Sí' else '❌ NO APROBÓ'
        
        # Convertir saltos de línea a HTML
        email_intro_html = self.email_intro.replace('\n', '<br>')
        email_footer_html = self.email_footer.replace('\n', '<br>')
        
        # Template HTML (diseño similar a la pantalla de resultados)
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background-color: #f5f5f5;
                }}
                .container {{ 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background-color: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }}
                .header {{ 
                    background: linear-gradient(135deg, #c62828 0%, #8d1e1e 100%);
                    color: white;
                    padding: 2rem;
                    text-align: center;
                }}
                .logo {{ 
                    max-width: 150px; 
                    margin-bottom: 1rem;
                    border-radius: 8px;
                }}
                .content {{ 
                    padding: 2rem;
                }}
                .details-grid {{ 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 1rem; 
                    margin-bottom: 2rem;
                }}
                .detail-card {{ 
                    background: #f8f9fa; 
                    padding: 1rem; 
                    border-radius: 8px;
                }}
                .scores-grid {{ 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
                    gap: 1rem; 
                    margin-bottom: 2rem;
                }}
                .score-card {{ 
                    padding: 1.5rem; 
                    border-radius: 8px; 
                    text-align: center;
                }}
                .score-main {{ 
                    background: #e3f2fd; 
                    color: #1976d2;
                }}
                .approved {{ 
                    background: #e8f5e8; 
                    color: #2e7d32;
                }}
                .failed {{ 
                    background: #ffebee; 
                    color: #c62828;
                }}
                .footer-info {{ 
                    background: #f0f4f8; 
                    padding: 1rem; 
                    border-radius: 8px; 
                    border: 2px dashed #667eea;
                    margin-bottom: 2rem;
                }}
                .email-footer {{ 
                    margin-top: 2rem; 
                    padding: 1.5rem;
                    background: #f8f9fa;
                    color: #666; 
                    font-size: 0.9rem; 
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }}
                .score-number {{ 
                    font-size: 2rem; 
                    font-weight: bold; 
                    margin: 0.5rem 0;
                }}
                .status-text {{ 
                    font-size: 1.2rem; 
                    font-weight: bold; 
                    margin: 0.5rem 0;
                }}
                h1 {{ 
                    margin: 0 0 0.5rem 0; 
                    font-size: 1.8rem;
                }}
                h2 {{ 
                    color: #333; 
                    margin-bottom: 1.5rem;
                }}
                h3 {{ 
                    margin: 0 0 0.5rem 0; 
                    font-size: 1rem;
                }}
                strong {{ 
                    color: #333;
                }}
                .small-text {{ 
                    font-size: 0.8rem; 
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="cid:logo" alt="Logo Inemec" class="logo">
                    <h1>🎉 Reporte de Evaluación</h1>
                    <p style="margin: 0; font-size: 1.1rem; opacity: 0.9;">
                        Evaluación completada exitosamente
                    </p>
                </div>
                
                <div class="email-intro">
                    <div style="padding: 1.5rem; background: #f8f9fa; border-left: 4px solid #c62828; margin: 1rem 0;">
                        <p style="margin: 0; font-size: 1rem; color: #333;">
                            <strong>Estimado(a) evaluado(a),</strong>
                        </p>
                        <p style="margin: 0.5rem 0; font-size: 0.95rem; color: #666;">
                            {email_intro_html}
                        </p>
                    </div>
                </div>
                
                <div class="content">
                    <h2>Detalles de tu Evaluación</h2>
                    
                    <div class="details-grid">
                        <div class="detail-card">
                            <strong>Participante:</strong>
                            <div style="margin-top: 0.5rem;">
                                <div>{user_name}</div>
                                <div class="small-text">Cédula: {user_cedula}</div>
                            </div>
                        </div>
                        
                        <div class="detail-card">
                            <strong>Procedimiento:</strong>
                            <div style="margin-top: 0.5rem;">
                                <div style="font-size: 0.9rem;">{procedure_codigo}</div>
                                <div class="small-text">{procedure_nombre}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="scores-grid">
                        <div class="score-card score-main">
                            <h3>Calificación Obtenida</h3>
                            <div class="score-number">{score_percentage}%</div>
                            <div class="small-text">
                                {correct_answers}/{total_questions} preguntas correctas
                            </div>
                        </div>
                        
                        <div class="score-card {conocimiento_class}">
                            <h3>Evaluación de Conocimiento</h3>
                            <div class="status-text">{conocimiento_status}</div>
                            <div class="small-text">{conocimiento_detail}</div>
                        </div>
                        
                        <div class="score-card {aplicado_class}">
                            <h3>Conocimiento Aplicado</h3>
                            <div class="status-text">{aplicado_status}</div>
                            <div class="small-text">Evaluación del supervisor</div>
                        </div>
                    </div>
                    
                    <div class="footer-info">
                        <div style="font-weight: bold; color: #333; margin-bottom: 0.5rem;">
                            📄 ID de Evaluación: {evaluation_id}
                        </div>
                        <div class="small-text">
                            Los resultados han sido guardados en el sistema
                        </div>
                    </div>
                </div>
                
                <div class="email-footer">
                    <div style="padding: 1.5rem; background: #f8f9fa; border-top: 2px solid #c62828; margin-top: 2rem; text-align: center;">
                        <p style="margin: 0; font-size: 0.9rem; color: #666;">
                            {email_footer_html}
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_template
    
    def test_connection(self) -> Tuple[bool, str]:
        """
        Probar conexión SMTP (útil para debugging)
        
        Returns:
            Tuple[bool, str]: (éxito, mensaje)
        """
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                return True, "Conexión exitosa"
        except Exception as e:
            return False, f"Error de conexión: {str(e)}"