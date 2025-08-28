
from langchain_pinecone import PineconeVectorStore
from langchain.chains import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
import os
from src.db_connector import DB_Pinecone
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("rag initialize")

class Ragchain:
    def __init__(self,dbcon:DB_Pinecone,llm_model):
        self.pinecone = dbcon
        self.vectorstore = PineconeVectorStore(
            index=dbcon.index,
            embedding=dbcon.embed_model,
            text_key="metadata.summary",    
            namespace="kt-agent"  
        )
        logger.info(f"✅ 벡터스토어 변환 성공했습니다. ")
        self.llm = llm_model
        logger.info(f"✅ RAG에 사용 될 LLM 모델로드에 성공했습니다. : {self.llm} ")

        #### Retriever
        #self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 30})
        #temper = self.retriever.invoke("AI관련된 사업 추천해줘")

        def format_docs(docs):
            logger.info(f"✅ docs를 보여드립니다. {docs}")
            if len(docs) == 0:
                logger.info("✅ 해당하는 문서가 없습니다!")
                return None
            # 검색한 문서 결과를 하나의 문단으로 합쳐줍니다.
            return "\n\n".join(doc.page_content for doc in docs)


        docs = self.pinecone.search_database("AI관련된 사업 추천해줘",30)
        context=format_docs(docs)
        #### Prompt
        self.system_prompt = (
            """
            당신은 기업 지원사업 추천 전문가입니다. 
            사용자가 제공한 정보를 바탕으로, 제공된 지원사업 공고(context) 중에서 
            가장 관련성이 높은 것들을 찾아 요약해서 추천합니다. 

            조건:
            1. 사용자의 사업 분야, 목적, 규모, 현재 상태 등을 고려해야 합니다.
            2. 관련성이 높은 순으로 최대 5개를 추천합니다.
            3. 추천 항목마다 지원사업명, 요약, 신청 방법/URL을 포함합니다.
            4. 관련 공고가 없으면 '적합한 지원사업이 없습니다.'라고 답하세요.
            5. 실제로 참조할 수 있는 자료가 아니라면 답변하지마세요.

            Context(지원사업 공고 정보):
            {context}

            사용자 정보:
            {input}

            추천 결과를 
            지원사업이름
            추천평점
            추천사유
            형태로 작성하세요.

            한국어로 작성하세요.
"""
        )
        logger.info(f"✅ RAG System Prompt : {self.system_prompt} \n\n ")
        
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", "{input}")
        ])
        
        # Chainning
        self.rag_chain = (
            {"context": context, "input": RunnablePassthrough()}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )

        logger.info(f"✅ RAG whole Prompt : {self.prompt} \n\n ")




if __name__=="__main__":
    pass